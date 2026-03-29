import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, createdAt: -1 }, { background: true });

export default mongoose.model("RefreshToken", refreshTokenSchema);
