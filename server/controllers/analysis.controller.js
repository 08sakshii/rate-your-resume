/**
 * analysis.controller.js
 *
 * Handles the POST /api/analyze request.
 *
 * Flow:
 *  1. Guard: ensure multer placed a file on req.file.
 *  2. Extract plain text from the PDF buffer via pdfParser.service.
 *  3. Edge case: if extracted text (trimmed) is < 50 chars, the PDF is
 *     almost certainly scanned/image-based — return 422.
 *  4. Success: return file metadata + character count + a short text preview.
 *  5. Extraction failure: return 500 with a generic message (no internal
 *     detail leaked to the client).
 */

const { extractTextFromPDF } = require('../services/pdfParser.service');

/**
 * analyzeResume
 *
 * Called after multer middleware has already validated the file type and size.
 * At this point req.file is guaranteed to be a PDF ≤ 5 MB, or multer would
 * have short-circuited with an error before reaching this handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const analyzeResume = async (req, res) => {
  // Guard: multer sets req.file only when a file field named "resume" was
  // present in the request. If the field was omitted entirely, req.file is
  // undefined and we return a descriptive 400 rather than crashing.
  if (!req.file) {
    return res.status(400).json({
      error: 'No file provided. Please attach a PDF under the field name "resume".',
    });
  }

  // Attempt to extract plain text from the PDF buffer.
  let extractedText;
  try {
    extractedText = await extractTextFromPDF(req.file.buffer);
  } catch (err) {
    // Extraction failed (corrupted file, encrypted PDF, etc.).
    // Log internally but do NOT surface raw error details to the client.
    console.error('[analyzeResume] PDF extraction error:', err.message);
    return res.status(500).json({
      error: 'Failed to process PDF. Please ensure the file is a valid, non-corrupted PDF.',
    });
  }

  // Edge case: scanned / image-based PDFs produce no meaningful text layer.
  // Fewer than 50 characters after trimming is a reliable signal that there
  // is no real text content — flag it rather than silently passing an empty
  // string downstream to the AI analysis step.
  const trimmedText = extractedText.trim();
  if (trimmedText.length < 50) {
    return res.status(422).json({
      error:
        'This appears to be a scanned or image-based PDF. Please upload a text-based PDF.',
    });
  }

  // Success — return metadata plus a preview.
  // The full extracted text is intentionally withheld from this response;
  // it will be used internally in the next ticket when the rule-based
  // checker and AI analysis are wired up.
  return res.status(200).json({
    message: 'File received and text extracted successfully.',
    file: {
      filename: req.file.originalname,
      size: req.file.size,         // bytes
      mimetype: req.file.mimetype,
    },
    extraction: {
      characterCount: trimmedText.length,
      textPreview: trimmedText.slice(0, 200), // first 200 characters only
    },
  });
};

module.exports = { analyzeResume };
