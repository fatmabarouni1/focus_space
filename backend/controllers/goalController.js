import Goal from "../models/Goal.js";
import { withOwner } from "../utils/ownership.js";
import { sendError } from "../utils/errors.js";

// Create a custom goal for the logged-in user.
const createGoal = async (req, res) => {
  const { title, description, target, unit, deadline, current } = req.body;

  if (!title || !unit || target === undefined || target === null) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Title, target, and unit are required."
    );
  }

  const goal = await Goal.create({
    title: title.trim(),
    description: description?.trim() || "",
    target: Number(target),
    current: Number(current) || 0,
    unit: unit.trim(),
    deadline: deadline ? new Date(deadline) : null,
    user_id: req.user.id,
  });

  return res.status(201).json({ message: "Goal created.", goal });
};

// List custom goals for the logged-in user.
const listGoals = async (req, res) => {
  const goals = await Goal.find({ user_id: req.user.id }).sort({ created_at: -1 });
  return res.json({ goals });
};

// Update a custom goal for the logged-in user.
const updateGoal = async (req, res) => {
  const { title, description, target, unit, deadline, current } = req.body;
  const updates = {};

  if (title !== undefined) {
    updates.title = title?.trim() || "Untitled Goal";
  }
  if (description !== undefined) {
    updates.description = description?.trim() || "";
  }
  if (target !== undefined) {
    updates.target = Number(target);
  }
  if (current !== undefined) {
    updates.current = Number(current);
  }
  if (unit !== undefined) {
    updates.unit = unit?.trim() || "";
  }
  if (deadline !== undefined) {
    updates.deadline = deadline ? new Date(deadline) : null;
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "No updates provided.");
  }

  const goal = await Goal.findOneAndUpdate(
    withOwner(req, { _id: req.params.goalId }),
    updates,
    { new: true }
  );

  if (!goal) {
    return sendError(res, 404, "NOT_FOUND", "Goal not found.");
  }

  return res.json({ message: "Goal updated.", goal });
};

// Delete a custom goal for the logged-in user.
const deleteGoal = async (req, res) => {
  const goal = await Goal.findOneAndDelete(
    withOwner(req, { _id: req.params.goalId })
  );

  if (!goal) {
    return sendError(res, 404, "NOT_FOUND", "Goal not found.");
  }

  return res.json({ message: "Goal deleted." });
};

export { createGoal, listGoals, updateGoal, deleteGoal };
