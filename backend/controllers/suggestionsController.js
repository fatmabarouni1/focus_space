import Suggestion from "../models/Suggestion.js";
import { withOwner } from "../utils/ownership.js";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/errors.js";

const listSuggestions = catchAsync(async (req, res) => {
  const { moduleId } = req.query;
  const filter = { userId: req.user.id };
  if (moduleId) {
    filter.moduleId = moduleId;
  }

  const suggestions = await Suggestion.find(filter).sort({ createdAt: -1 });
  return res.json({ suggestions });
});

const createSuggestion = catchAsync(async (req, res) => {
  const { title, description, level, moduleId, source } = req.body;

  if (!title || !title.trim()) {
    throw new AppError("Title is required.", 400);
  }

  const suggestion = await Suggestion.create({
    userId: req.user.id,
    moduleId: moduleId || null,
    title: title.trim(),
    description: description?.trim() || "",
    level: level?.trim() || "",
    source: source === "ai" ? "ai" : "manual",
  });

  return res.status(201).json({ suggestion });
});

const deleteSuggestion = catchAsync(async (req, res) => {
  const suggestion = await Suggestion.findOneAndDelete(
    withOwner(req, { _id: req.params.id }, "userId")
  );

  if (!suggestion) {
    throw new AppError("Suggestion not found.", 404);
  }

  return res.json({ message: "Suggestion deleted." });
});

export { listSuggestions, createSuggestion, deleteSuggestion };
