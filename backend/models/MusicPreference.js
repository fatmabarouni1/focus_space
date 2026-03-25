import mongoose from "mongoose";

// Stores a user's music platform preferences.
const musicPreferenceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: { type: String, enum: ["spotify", "youtube"], required: true },
    track_url: { type: String, required: true },
    shared: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

musicPreferenceSchema.index({ user_id: 1 }, { unique: true });

export default mongoose.model("MusicPreference", musicPreferenceSchema);
