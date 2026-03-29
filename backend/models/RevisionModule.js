import mongoose from "mongoose";

// Revision module metadata for a user.
const revisionModuleSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

revisionModuleSchema.index({ user_id: 1, updated_at: -1 }, { background: true });

export default mongoose.model("RevisionModule", revisionModuleSchema);
