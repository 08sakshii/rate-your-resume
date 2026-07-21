
jest.mock('pdf-parse');
const pdfParse = require('pdf-parse');
const { extractTextFromPDF } = require('../services/pdfParser.service');

describe('extractTextFromPDF', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful extraction', () => {
    it('returns the text field from pdf-parse\'s resolved result', async () => {
      pdfParse.mockResolvedValue({ text: 'John Doe\nSoftware Engineer\n...' });

      const result = await extractTextFromPDF(Buffer.from('fake-pdf-bytes'));

      expect(result).toBe('John Doe\nSoftware Engineer\n...');
    });

    it('calls pdf-parse exactly once with the buffer it was given', async () => {
      pdfParse.mockResolvedValue({ text: 'some text' });
      const inputBuffer = Buffer.from('fake-pdf-bytes');

      await extractTextFromPDF(inputBuffer);

      expect(pdfParse).toHaveBeenCalledTimes(1);
      expect(pdfParse).toHaveBeenCalledWith(inputBuffer);
    });
  });

  describe('when pdf-parse throws', () => {
    it('re-throws an Error with a clear, prefixed message', async () => {
      pdfParse.mockRejectedValue(new Error('bad XRef entry'));

      await expect(extractTextFromPDF(Buffer.from('bad-bytes'))).rejects.toThrow(
        'Failed to extract text from PDF: bad XRef entry'
      );
    });

    it('rejects with an actual Error instance, not a raw string/value', async () => {
      pdfParse.mockRejectedValue(new Error('corrupted file'));

      await expect(extractTextFromPDF(Buffer.from('bad-bytes'))).rejects.toBeInstanceOf(
        Error
      );
    });
  });
});