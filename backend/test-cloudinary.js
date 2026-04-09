import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("--- Cloudinary Diagnostic Tool ---");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "Present" : "MISSING");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "Present" : "MISSING");

if (process.env.CLOUDINARY_CLOUD_NAME === "Root") {
    console.warn("\nWARNING: Your Cloud Name is set to 'Root'. This is almost certainly incorrect.");
    console.warn("Please log in to https://cloudinary.com/console and copy your 'Cloud Name' from the Dashboard.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function runTest() {
  try {
    console.log("\nAttempting to ping Cloudinary API...");
    // A simple way to test credentials without an upload is checking account details
    const result = await cloudinary.api.usage();
    console.log("SUCCESS: Cloudinary connection established!");
    console.log("Plan:", result.plan);
    console.log("Usage percentage:", result.credits.used_percent, "%");
  } catch (err) {
    console.error("\nFAILED to connect to Cloudinary.");
    console.error("Error Details:", err.message);
    if (err.message.includes("ECONNRESET")) {
      console.error("\nHint: 'ECONNRESET' often means the Cloud Name in your URL is invalid or blocked.");
    }
  }
}

runTest();
