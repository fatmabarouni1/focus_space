import mongoose from "mongoose";

// Maps users to study sessions for many-to-many relationships.
const sessionParticipantSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "StudySession", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joined_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

sessionParticipantSchema.index({ session_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model("SessionParticipant", sessionParticipantSchema);
