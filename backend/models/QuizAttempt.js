import mongoose from "mongoose";

const wrongAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    question: { type: String, required: true },
    userAnswer: { type: String, default: "" },
    correctAnswer: { type: String, required: true },
    topic: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
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
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    totalQuestions: { type: Number, required: true, min: 0 },
    correctCount: { type: Number, required: true, min: 0 },
    score: { type: Number, required: true, min: 0, max: 100 },
    wrongAnswers: { type: [wrongAnswerSchema], default: [] },
    submittedAnswers: { type: [String], default: [] },
    timeSpentSeconds: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

quizAttemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
