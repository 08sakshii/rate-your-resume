const pdfParse = require("pdf-parse");

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
};

module.exports = { extractTextFromPDF };
