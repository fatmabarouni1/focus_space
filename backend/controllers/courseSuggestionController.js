import CourseSuggestion from "../models/CourseSuggestion.js";
import { sendError } from "../utils/errors.js";

// Create a course suggestion.
const createSuggestion = async (req, res) => {
  try {
    const { title, description, level } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 400, "VALIDATION_ERROR", "Title is required.");
    }

    const suggestion = await CourseSuggestion.create({
      title: title.trim(),
      description: description?.trim() || "",
      level: level?.trim() || "",
    });

    return res.status(201).json(suggestion);
  } catch (error) {
    console.error("Failed to create course suggestion:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Internal server error.");
  }
};

// List all course suggestions.
const listSuggestions = async (req, res) => {
  try {
    const suggestions = await CourseSuggestion.find().sort({ createdAt: -1 });
    return res.json(suggestions);
  } catch (error) {
    console.error("Failed to list course suggestions:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Internal server error.");
  }
};

export { createSuggestion, listSuggestions };
