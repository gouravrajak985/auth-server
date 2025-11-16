// src/scripts/seedAdmin.js

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env");
  process.exit(1);
}

const seedAdmin = async () => {
  try {
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ globalRoles: { $in: ["super_admin"] } });

    if (existingAdmin) {
      console.log("⚠️ Admin user already exists:");
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Default Admin Credentials
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@mywebsite.com";
    const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";


    const admin = await User.create({
      email: adminEmail.toLowerCase(),
      username: adminUsername.toLowerCase(),
      password: adminPassword,
      is_verified: true,
      globalRoles: ["super_admin"],
    });

    console.log("🎉 Admin user created successfully!");
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Username: ${admin.username}`);
    console.log(`   🔐 Password: ${adminPassword}`);
    console.log("⚠️ Please change this password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
