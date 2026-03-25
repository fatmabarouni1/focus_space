import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq"],
      default: "mcq",
    },
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 4,
        message: "Quiz questions must have exactly 4 options.",
      },
      default: [],
    },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
    topic: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
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
    topic: { type: String, default: null },
    sourceChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "DocumentChunk" }],
    questions: { type: [quizQuestionSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

quizSchema.index({ userId: 1, documentId: 1, createdAt: -1 });

export default mongoose.model("Quiz", quizSchema);
