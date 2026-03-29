import mongoose from "mongoose";

const moduleResourceSuggestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RevisionModule",
      required: true,
    },
    type: { type: String, enum: ["resources"], default: "resources" },
    contextSnapshot: {
      moduleTitle: { type: String, default: "" },
      notesExcerpt: { type: String, default: "" },
      links: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
          type: { type: String, default: "" },
        },
      ],
      documents: [
        {
          filename: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
    },
    outputJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

moduleResourceSuggestionSchema.index({ moduleId: 1, createdAt: -1 }, { background: true });
moduleResourceSuggestionSchema.index({ userId: 1, moduleId: 1, createdAt: -1 }, { background: true });

export default mongoose.model("ModuleResourceSuggestion", moduleResourceSuggestionSchema);
