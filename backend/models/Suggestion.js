import mongoose from "mongoose";

// Stores AI/manual suggestions tied to a user (optionally to a module).
const suggestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "RevisionModule", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    level: { type: String, default: "" },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Suggestion", suggestionSchema);
