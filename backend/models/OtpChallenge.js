import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ["register", "password_reset"],
      required: true,
    },
    method: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    email: { type: String, lowercase: true, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    verificationCode: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },
    verificationCodeExpiresAt: { type: Date, required: true },
    verificationAttempts: { type: Number, default: 0, min: 0, max: 3 },
    pendingData: { type: Object, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

otpChallengeSchema.index({ verificationCodeExpiresAt: 1 }, { expireAfterSeconds: 0 });
otpChallengeSchema.index(
  { purpose: 1, method: 1, email: 1, phone: 1 },
  { unique: true }
);

export default mongoose.model("OtpChallenge", otpChallengeSchema);
