import Timer from "../models/Timer.js";
import { sendError } from "../utils/errors.js";

// Create a timer configuration for a user.
const createTimer = async (req, res) => {
  const { focus_duration, break_duration, mode } = req.body;

  if (!focus_duration || !break_duration || !mode) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Focus duration, break duration, and mode are required."
    );
  }

  const timer = await Timer.create({
    user_id: req.user.id,
    focus_duration,
    break_duration,
    mode,
  });

  return res.status(201).json({ message: "Timer created.", timer });
};

// List timers for the logged-in user.
const listTimers = async (req, res) => {
  const timers = await Timer.find({ user_id: req.user.id }).sort({ created_at: -1 });
  return res.json({ timers });
};

export { createTimer, listTimers };
