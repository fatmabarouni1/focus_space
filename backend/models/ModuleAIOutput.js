import mongoose from "mongoose";

const moduleAiOutputSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RevisionModule",
      required: true,
    },
    type: {
      type: String,
      enum: ["summary", "quiz", "resources"],
      required: true,
    },
    inputSnapshot: {
      moduleTitle: { type: String, default: "" },
      notesExcerpt: { type: String, default: "" },
      links: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
      pdfNames: [{ type: String, default: "" }],
    },
    outputJson: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

moduleAiOutputSchema.index({ userId: 1, moduleId: 1, type: 1, createdAt: -1 });

export default mongoose.model("ModuleAIOutput", moduleAiOutputSchema);
