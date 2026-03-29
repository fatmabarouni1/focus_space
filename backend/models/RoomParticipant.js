import mongoose from "mongoose";

const roomParticipantSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["focus", "break", "idle"], default: "focus" },
    joined_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

roomParticipantSchema.index({ room_id: 1, user_id: 1 }, { unique: true });
roomParticipantSchema.index({ user_id: 1, joined_at: -1 }, { background: true });
roomParticipantSchema.index({ room_id: 1, joined_at: -1 }, { background: true });

export default mongoose.model("RoomParticipant", roomParticipantSchema);
