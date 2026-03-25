import mongoose from "mongoose";

// Custom goals created by a user.
const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: { type: String, required: true },
    deadline: { type: Date, default: null },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Goal", goalSchema);
