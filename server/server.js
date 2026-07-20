// Load environment variables FIRST — before any other require() calls,
// so that process.env.* is populated by the time Express/Mongoose read it.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// --- Middleware ---
// cors() allows cross-origin requests from the React frontend (different port).
app.use(cors());

// express.json() parses incoming requests with a JSON body so req.body is
// available in route handlers. Without this, req.body would be undefined.
app.use(express.json());

// --- Start server only after DB connects ---
// We intentionally await the DB connection before calling app.listen().
// If the DB is down, there's no point accepting requests — a hard crash
// with a clear error is more honest than silently returning 500s.
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000; // Fallback to 5000 if PORT not set
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Log the full error so the root cause is visible in the console/logs.
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    // Exit with code 1 (failure) so process managers (e.g. PM2, Docker)
    // know the server did not start successfully and can restart/alert.
    process.exit(1);
  }
}

startServer();
