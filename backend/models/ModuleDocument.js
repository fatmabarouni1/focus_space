import mongoose from "mongoose";

// Uploaded documents associated with a revision module.
const moduleDocumentSchema = new mongoose.Schema(
  {
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: "RevisionModule", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    extractedText: { type: String, default: "" },
    extractedChars: { type: Number, default: 0 },
    extractedAt: { type: Date, default: null },
    extractionError: { type: String, default: null },
    aiEmbeddingStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
    },
    aiEmbeddingModel: { type: String, default: null },
    aiEmbeddingDimensions: { type: Number, default: null },
    aiChunksCount: { type: Number, default: 0 },
    aiIndexedAt: { type: Date, default: null },
    aiLastProcessedAt: { type: Date, default: null },
    aiProcessingError: { type: String, default: null },
  },
  { versionKey: false }
);

moduleDocumentSchema.index({ user_id: 1, module_id: 1, uploadedAt: -1 });

export default mongoose.model("ModuleDocument", moduleDocumentSchema);
