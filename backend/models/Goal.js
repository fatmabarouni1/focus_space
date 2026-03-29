import mongoose from "mongoose";

// Custom goals created by a user.
const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    deadline: { type: Date, default: null },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

goalSchema.index({ user_id: 1, created_at: -1 }, { background: true });
goalSchema.index({ user_id: 1, status: 1 }, { background: true });

export default mongoose.model("Goal", goalSchema);
