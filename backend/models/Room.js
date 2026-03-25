import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    host_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["focus", "break", "idle"], default: "idle" },
    participants_count: { type: Number, default: 1, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Room", roomSchema);
