import mongoose from "mongoose";

// Calendar events for a user.
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, required: true },
    time: { type: String, default: "" },
    type: {
      type: String,
      enum: ["session", "deadline", "task"],
      required: true,
    },
    duration: { type: Number, default: null },
    completed: { type: Boolean, default: false },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Event", eventSchema);
