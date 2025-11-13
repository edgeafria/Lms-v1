const cloudinary = require('cloudinary').v2;

// 🐞 --- START DEBUG LOGS --- 🐞
// These logs will run when your server first starts.
console.log("--- [DEBUG] backend/config/cloudinary.js ---");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "SET (****" + String(process.env.CLOUDINARY_CLOUD_NAME).slice(-4) + ")" : "!!! UNDEFINED !!!");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "SET (****" + String(process.env.CLOUDINARY_API_KEY).slice(-4) + ")" : "!!! UNDEFINED !!!");
// We only check if the secret exists, we NEVER log it.
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "SET (Exists)" : "!!! UNDEFINED !!!");
console.log("----------------------------------------------");
// 🐞 --- END DEBUG LOGS --- 🐞

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;