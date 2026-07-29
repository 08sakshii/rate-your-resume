jest.mock('@google/generative-ai');

process.env.GEMINI_API_KEY = 'test-api-key';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { analyzeWithGemini, GeminiValidationError } = require('../services/geminiClient.service');

describe('analyzeWithGemini', () => {
  let mockGenerateContent;
  let mockGetGenerativeModel;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('successfully returns the validated object on the first attempt', async () => {
    const validJson = JSON.stringify({ summary: 'Perfect resume', score: 95 });
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => validJson,
      },
    });

    const result = await analyzeWithGemini('Resume text');
    expect(result).toEqual({ summary: 'Perfect resume', score: 95 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-3.5-flash',
      systemInstruction: expect.any(String),
    });
  });

  it('strips markdown fences and returns validated object on first attempt', async () => {
    const markdownJson = `\`\`\`json
{
  "summary": "Great resume",
  "score": 88
}
\`\`\``;
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => markdownJson,
      },
    });

    const result = await analyzeWithGemini('Resume text');
    expect(result).toEqual({ summary: 'Great resume', score: 88 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('retries once if first response is invalid JSON, and succeeds on second attempt', async () => {
    const invalidJson = 'Not a JSON string';
    const validJson = JSON.stringify({ summary: 'Improved resume', score: 90 });

    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => invalidJson,
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => validJson,
        },
      });

    const result = await analyzeWithGemini('Resume text');
    expect(result).toEqual({ summary: 'Improved resume', score: 90 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('retries once if first response fails Zod schema validation, and succeeds on second attempt', async () => {
    const invalidSchema = JSON.stringify({ summary: 'Missing score field' });
    const validJson = JSON.stringify({ summary: 'Valid resume', score: 75 });

    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => invalidSchema,
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => validJson,
        },
      });

    const result = await analyzeWithGemini('Resume text');
    expect(result).toEqual({ summary: 'Valid resume', score: 75 });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws GeminiValidationError if both first and second attempts fail validation', async () => {
    const invalidJson1 = 'Bad JSON 1';
    const invalidJson2 = 'Bad JSON 2';

    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => invalidJson1,
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => invalidJson2,
        },
      });

    await expect(analyzeWithGemini('Resume text')).rejects.toThrow(GeminiValidationError);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry and immediately bubbles up the error if the first API call throws an error', async () => {
    const apiError = new Error('API quota limit exceeded / 429');
    mockGenerateContent.mockRejectedValue(apiError);

    await expect(analyzeWithGemini('Resume text')).rejects.toThrow('API quota limit exceeded / 429');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('bubbles up the error if the retry API call throws an error', async () => {
    const invalidJson = 'Not JSON';
    const apiError = new Error('API quota limit exceeded on retry');

    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => invalidJson,
        },
      })
      .mockRejectedValueOnce(apiError);

    await expect(analyzeWithGemini('Resume text')).rejects.toThrow('API quota limit exceeded on retry');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws an error if GEMINI_API_KEY is not set in environment', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(analyzeWithGemini('Resume text')).rejects.toThrow('GEMINI_API_KEY is not set in environment');
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
