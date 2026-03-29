import mongoose from "mongoose";

// Notes or summaries for a revision module.
const moduleNoteSchema = new mongoose.Schema(
  {
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: "RevisionModule", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

moduleNoteSchema.index({ module_id: 1 }, { background: true });
moduleNoteSchema.index({ user_id: 1, module_id: 1 }, { unique: true, background: true });

export default mongoose.model("ModuleNote", moduleNoteSchema);
