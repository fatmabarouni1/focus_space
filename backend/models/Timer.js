import mongoose from "mongoose";

// Stores timer preferences per user (Pomodoro/50-10/custom).
const timerSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    focus_duration: { type: Number, required: true },
    break_duration: { type: Number, required: true },
    mode: { type: String, enum: ["pomodoro", "50-10", "custom"], required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Timer", timerSchema);
