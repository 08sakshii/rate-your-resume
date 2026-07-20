const mongoose = require('mongoose');

/**
 * connectDB - Connects to MongoDB using the URI in process.env.MONGO_URI.
 *
 * We export this as a standalone async function (not called here) so that
 * server.js controls when the connection happens and can handle the result
 * (e.g. crash on failure, start listening on success).
 *
 * Mongoose's connect() returns a promise, so we let the caller await it
 * and catch errors at the top level rather than swallowing them here.
 */
async function connectDB() {
  // mongoose.connect() handles the connection pool internally — no need to
  // manually open/close connections for a standard Express app.
  const conn = await mongoose.connect(process.env.MONGO_URI);

  // Log just the host so the URI (which may contain a password) is never
  // printed to stdout.
  console.log(`MongoDB connected: ${conn.connection.host}`);
}

module.exports = connectDB;
