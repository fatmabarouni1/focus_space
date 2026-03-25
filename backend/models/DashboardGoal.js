import mongoose from "mongoose";

// Stores per-user targets for dashboard metrics.
const dashboardGoalSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    daily_sessions_target: { type: Number, default: 4 },
    weekly_sessions_target: { type: Number, default: 20 },
    daily_focus_minutes_target: { type: Number, default: 120 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("DashboardGoal", dashboardGoalSchema);
