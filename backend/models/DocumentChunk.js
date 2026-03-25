import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
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
    chunkIndex: { type: Number, required: true, min: 0 },
    text: { type: String, required: true },
    tokenEstimate: { type: Number, required: true, min: 1 },
    embedding: { type: [Number], default: [] },
    embeddingModel: { type: String, required: true },
    sourceLabel: { type: String, default: "" },
    metadata: {
      startWord: { type: Number, default: 0 },
      endWord: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

export default mongoose.model("DocumentChunk", documentChunkSchema);
