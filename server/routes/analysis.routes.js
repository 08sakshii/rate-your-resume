/**
 * analysis.routes.js
 *
 * Defines the POST /api/analyze route.
 * Mounted in server.js at app.use('/api/analyze', ...) so individual route
 * paths here are relative — the single upload endpoint is just POST '/'.
 *
 * Multer responsibilities in this file:
 *  - memoryStorage: keep the file buffer in RAM, never touch the filesystem
 *  - fileFilter:    reject non-PDF uploads immediately with a 400
 *  - limits:        cap uploads at 5 MB to prevent memory exhaustion
 *
 * Multer errors (LIMIT_FILE_SIZE, mimetype rejection) do NOT flow through
 * Express's default error chain automatically, so we use a small inline shim
 * to catch them and return clean JSON 400 responses.
 */

const express = require('express');
const multer = require('multer');
const { confirmUpload } = require('../controllers/analysis.controller');

const router = express.Router();

// ---------------------------------------------------------------------------
// Multer configuration
// ---------------------------------------------------------------------------

const storage = multer.memoryStorage();

/**
 * fileFilter — called by multer for every incoming file before it is stored.
 *
 * @param {import('express').Request} _req  - Not used; prefix with _ to signal intent.
 * @param {Express.Multer.File}       file  - Multer file object. file.mimetype holds
 *                                            the MIME type reported by the client.
 * @param {Function}                  cb    - Callback: cb(error, acceptFile).
 */
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // accept the file
  } else {
    // Passing an Error as the first argument causes multer to abort the upload
    // and forward the error. We tag it so the route shim can distinguish it
    // from other multer errors and return a meaningful message.
    const err = new Error(
      `Invalid file type "${file.mimetype}". Only PDF files are accepted.`
    );
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB in bytes
  },
});

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

/**
 * POST /api/analyze
 *
 * Accepts a single file field named "resume" (PDF, ≤ 5 MB).
 * Uses an inline wrapper around the multer middleware so that upload errors
 * (wrong type, file too large) are caught here and returned as JSON 400s
 * rather than crashing the process or leaking a raw HTML error page.
 */
router.post('/', (req, res) => {
  // upload.single() returns a middleware function; call it manually so we
  // can intercept its error argument rather than passing it to next().
  upload.single('resume')(req, res, (err) => {
    if (err) {
      // Multer's built-in size-limit error
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large. Maximum allowed size is 5 MB.',
        });
      }

      // Our custom mimetype rejection from fileFilter
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: err.message });
      }

      // Unexpected multer or Express error — surface it without leaking internals
      return res.status(500).json({ error: 'File upload failed. Please try again.' });
    }

    // No upload error — hand off to the controller
    return confirmUpload(req, res);
  });
});

module.exports = router;
