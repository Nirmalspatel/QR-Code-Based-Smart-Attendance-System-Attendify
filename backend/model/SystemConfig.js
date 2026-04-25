import mongoose from "mongoose";

// Single-document config store for system-wide settings.
// We always upsert with a fixed key so there is exactly one record.
const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    // e.g. ["nirmauni.ac.in", "gmail.com"]
    // Empty array  →  no restriction (all domains allowed)
    allowedDomains: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);
