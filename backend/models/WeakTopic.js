import mongoose from "mongoose";

const weakTopicSchema = new mongoose.Schema(
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
    topic: { type: String, required: true, trim: true },
    weaknessScore: { type: Number, required: true, default: 0 },
    attemptsCount: { type: Number, required: true, default: 0 },
    mistakesCount: { type: Number, required: true, default: 0 },
    averageScore: { type: Number, required: true, default: 0 },
    lastQuizScore: { type: Number, required: true, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: null },
    nextRecommendedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

weakTopicSchema.index({ userId: 1, documentId: 1, topic: 1 }, { unique: true });
weakTopicSchema.index({ userId: 1, weaknessScore: -1 });

export default mongoose.model("WeakTopic", weakTopicSchema);
