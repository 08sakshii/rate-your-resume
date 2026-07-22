const { extractTextFromPDF } = require('../services/pdfParser.service');
const { runRuleBasedChecks } = require('../services/ruleBasedChecker.service');

const analyzeResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file provided. Please attach a PDF under the field name "resume".',
    });
  }

  let extractedText;
  try {
    extractedText = await extractTextFromPDF(req.file.buffer);
  } catch (err) {
    console.error('[analyzeResume] PDF extraction error:', err.message);
    return res.status(500).json({
      error: 'Failed to process PDF. Please ensure the file is a valid, non-corrupted PDF.',
    });
  }

  // <50 chars after trim = almost certainly a scanned/image PDF with no real text layer
  const trimmedText = extractedText.trim();
  if (trimmedText.length < 50) {
    return res.status(422).json({
      error:
        'This appears to be a scanned or image-based PDF. Please upload a text-based PDF.',
    });
  }

  // pure sync function on a string we've already validated — nothing to catch
  const ruleBasedAnalysis = runRuleBasedChecks(trimmedText);

  return res.status(200).json({
    message: 'File received and text extracted successfully.',
    file: {
      filename: req.file.originalname,
      size: req.file.size, // bytes
      mimetype: req.file.mimetype,
    },
    extraction: {
      characterCount: trimmedText.length,
      textPreview: trimmedText.slice(0, 200), // full text withheld on purpose, for now
    },
    ruleBasedAnalysis,
  });
};

module.exports = { analyzeResume };