import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Verification of credentials presence
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("CRITICAL: Cloudinary credentials missing in .env!");
} else {
  console.log("Cloudinary configuration loaded for cloud:", process.env.CLOUDINARY_CLOUD_NAME);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(imageName) {
  const imagePath = path.resolve("public", "uploads", imageName);
  console.log("Uploading to Cloudinary from path:", imagePath);
  
  if (!fs.existsSync(imagePath)) {
    throw new Error(`File not found at path: ${imagePath}`);
  }

  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "atendo_attendance",
    });
    console.log("Cloudinary upload success:", result.url);
    return result.secure_url || result.url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  } finally {
    // Delete the local file in all cases to save storage
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting local file after upload/failure:", err);
        else console.log("Local file deleted successfully:", imageName);
      });
    }
  }
}

export default uploadImage;
