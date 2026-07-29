const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SYSTEM_PROMPT, buildUserPrompt } = require("../prompts/resumeAnalysis.prompts");
const { geminiAnalysisSchema } = require("../schemas/geminiAnalysis.schema");

class GeminiValidationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "GeminiValidationError";
    this.originalError = originalError;
  }
}

// Lazily initialize generative AI client using process.env.GEMINI_API_KEY
// No module-level state is maintained to avoid caching/pollution issues.

/**
 * Clean markdown block fences (e.g. ```json ... ```) from a string.
 */
function cleanJsonResponse(text) {
  if (!text) return "";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

/**
 * Validates the Gemini response string.
 * Returns the parsed object if valid.
 * Throws an error if invalid JSON or validation fails.
 */
function parseAndValidate(responseText) {
  const cleaned = cleanJsonResponse(responseText);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Invalid JSON format: ${err.message}`);
  }

  const validation = geminiAnalysisSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(`Schema validation failed: ${validation.error.message}`);
  }

  return validation.data;
}

/**
 * Calls the model.generateContent API.
 */
async function executeGeneration(model, userPrompt) {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  return result.response.text();
}

/**
 * Calls Gemini and validates the response, retrying once strictly on validation/parsing errors.
 * API level exceptions (e.g. rate limit, authentication, timeout) will propagate immediately.
 */
async function analyzeWithGemini(resumeText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const userPrompt = buildUserPrompt(resumeText);

  let rawText;
  try {
    rawText = await executeGeneration(model, userPrompt);
  } catch (apiError) {
    // API/network level error: immediately bubble up
    throw apiError;
  }

  try {
    return parseAndValidate(rawText);
  } catch (validationError) {
    // JSON parsing or validation failed: retry once
    try {
      rawText = await executeGeneration(model, userPrompt);
    } catch (apiError) {
      // API level error on retry: bubble up
      throw apiError;
    }

    try {
      return parseAndValidate(rawText);
    } catch (secondValidationError) {
      // Second attempt also failed parsing/validation: throw custom error
      throw new GeminiValidationError(
        `Gemini response validation failed after retry: ${secondValidationError.message}`,
        secondValidationError
      );
    }
  }
}

module.exports = {
  analyzeWithGemini,
  GeminiValidationError,
  cleanJsonResponse,
};
