import mongoose from "mongoose";

// Represents a study session (solo or group).
const studySessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["solo", "group"], required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    is_active: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    start_time: { type: Date, default: Date.now },
    end_time: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    duration_minutes: { type: Number, default: null },
  },
  { versionKey: false }
);

export default mongoose.model("StudySession", studySessionSchema);
