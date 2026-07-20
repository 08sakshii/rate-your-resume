/**
 * analysis.controller.js
 *
 * Handles the POST /api/analyze request.
 *
 * Scope (this ticket): validate that a file was received and echo back its
 * metadata. Text extraction and AI analysis are out of scope here and will
 * be added in a subsequent ticket.
 */

/**
 * confirmUpload
 *
 * Called after multer middleware has already validated the file type and size.
 * At this point req.file is guaranteed to be a PDF ≤ 5 MB, or multer would
 * have short-circuited with an error before reaching this handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const confirmUpload = (req, res) => {
  // Guard: multer sets req.file only when a file field named "resume" was
  // present in the request. If the field was omitted entirely, req.file is
  // undefined and we return a descriptive 400 rather than crashing.
  if (!req.file) {
    return res.status(400).json({
      error: 'No file provided. Please attach a PDF under the field name "resume".',
    });
  }

  // Echo the file metadata back as confirmation of receipt.
  // buffer contents are intentionally excluded — they're in memory but not
  // needed in the response, and serialising them would bloat the payload.
  return res.status(200).json({
    message: 'File received successfully.',
    file: {
      filename: req.file.originalname,
      size: req.file.size,       // bytes
      mimetype: req.file.mimetype,
    },
  });
};

module.exports = { confirmUpload };
