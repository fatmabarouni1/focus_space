import mongoose from "mongoose";

// Personal or AI-generated notes for a user.
const noteSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Untitled Note" },
    content: { type: String, required: true },
    ai_generated: { type: Boolean, default: false },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Note", noteSchema);
