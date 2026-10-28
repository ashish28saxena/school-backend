const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("Cloudinary configuration:", {
  cloudNamePresent: !!process.env.CLOUDINARY_CLOUD_NAME,
  apiKeyPresent: !!process.env.CLOUDINARY_API_KEY,
  apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;