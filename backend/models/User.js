import mongoose from "mongoose";

// Stores user identity and credentials (hashed password).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, trim: true, default: null },
    // Hashed password (bcrypt).
    password: { type: String, required: true },
    // Legacy hashed password field for older records (migrated on login).
    password_hash: { type: String, default: null },
    emailVerified: { type: Boolean, default: false },
    verificationMethod: {
      type: String,
      enum: ["email", "sms", null],
      default: null,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Hashed refresh token (SHA-256). Never store raw refresh tokens.
    refreshToken: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    streakCount: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    freezeTokens: { type: Number, default: 1, min: 0, max: 2 },
  },
  { versionKey: false }
);

export default mongoose.model("User", userSchema);
