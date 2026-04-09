import mongoose from "mongoose";
const schema = mongoose.Schema;

const adminSchema = new schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    pno: { type: String, required: true },
    password: { type: String, required: true }, // Password save as hash
    profileImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("admin", adminSchema);
