import mongoose from "mongoose";

const chatSourceSchema = new mongoose.Schema(
  {
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentChunk",
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModuleDocument",
      required: true,
    },
    chunkIndex: { type: Number, required: true },
    sourceLabel: { type: String, default: "" },
    snippet: { type: String, default: "" },
    score: { type: Number, default: null },
  },
  { _id: false }
);

const studyChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RevisionModule",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModuleDocument",
      required: true,
      index: true,
    },
    question: { type: String, required: true },
    mode: {
      type: String,
      enum: ["simple", "detailed", "example"],
      default: "detailed",
    },
    answer: { type: String, required: true },
    sources: { type: [chatSourceSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

studyChatSchema.index({ userId: 1, documentId: 1, createdAt: -1 });

export default mongoose.model("StudyChat", studyChatSchema);
