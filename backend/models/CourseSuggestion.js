import mongoose from "mongoose";

// Stores course suggestions for StudyPal.
const courseSuggestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    level: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("CourseSuggestion", courseSuggestionSchema);
