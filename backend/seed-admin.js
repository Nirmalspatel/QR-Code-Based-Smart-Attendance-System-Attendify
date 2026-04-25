import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import { Admin } from "./model/Admin.js"; // adjust path if needed

dotenv.config();

// Default admin credentials
const ADMIN_NAME = "Super Admin";
const ADMIN_EMAIL = "admin@admin.com";
let ADMIN_PASSWORD = "admin"; // You should change this in production!

function computeHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

const seedAdmin = async () => {
  try {
    console.log("Connecting to the database...");
    await mongoose.connect(process.env.MONGODB || "mongodb://127.0.0.1:27017/atendo");
    console.log("Database connected successfully.");

    // Check if an admin already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log(`An admin with the email ${ADMIN_EMAIL} already exists in the database.`);
      process.exit(0);
    }

    // Hash the password exactly as the frontend does during signup/login
    // Frontend does: password = computeHash(password); password = computeHash(email + password);
    let hashedPassword = computeHash(ADMIN_PASSWORD);
    hashedPassword = computeHash(ADMIN_EMAIL + hashedPassword);

    const admin = new Admin({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      pno: "0000000000",
      password: hashedPassword,
    });

    await admin.save();

    console.log("=========================================");
    console.log("🚀 Admin successfully created!");
    console.log("=========================================");
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log("=========================================");
    console.log("🚨 IMPORTANT: Change this password immediately after logging in!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding the admin user:", error.message);
    process.exit(1);
  }
};

seedAdmin();
