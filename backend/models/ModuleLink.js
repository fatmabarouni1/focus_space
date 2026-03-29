import mongoose from "mongoose";

// External links for a revision module.
const moduleLinkSchema = new mongoose.Schema(
  {
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: "RevisionModule", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

moduleLinkSchema.index({ module_id: 1, created_at: -1 }, { background: true });
moduleLinkSchema.index({ user_id: 1, module_id: 1, created_at: -1 }, { background: true });

export default mongoose.model("ModuleLink", moduleLinkSchema);
