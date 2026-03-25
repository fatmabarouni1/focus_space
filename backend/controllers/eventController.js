import Event from "../models/Event.js";
import { withOwner } from "../utils/ownership.js";
import { sendError } from "../utils/errors.js";

// Create an event for the logged-in user.
const createEvent = async (req, res) => {
  const { title, description, date, time, type, duration, completed } = req.body;

  if (!title || !date || !type) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Title, date, and type are required."
    );
  }

  const event = await Event.create({
    title: title.trim(),
    description: description?.trim() || "",
    date,
    time: time || "",
    type,
    duration: duration ? Number(duration) : null,
    completed: Boolean(completed),
    user_id: req.user.id,
  });

  return res.status(201).json({ message: "Event created.", event });
};

// List events for the logged-in user.
const listEvents = async (req, res) => {
  const events = await Event.find({ user_id: req.user.id }).sort({
    date: 1,
    time: 1,
  });
  return res.json({ events });
};

// Update an event for the logged-in user.
const updateEvent = async (req, res) => {
  const { title, description, date, time, type, duration, completed } = req.body;
  const updates = {};

  if (title !== undefined) {
    updates.title = title?.trim() || "Untitled Event";
  }
  if (description !== undefined) {
    updates.description = description?.trim() || "";
  }
  if (date !== undefined) {
    updates.date = date;
  }
  if (time !== undefined) {
    updates.time = time || "";
  }
  if (type !== undefined) {
    updates.type = type;
  }
  if (duration !== undefined) {
    updates.duration = duration ? Number(duration) : null;
  }
  if (completed !== undefined) {
    updates.completed = Boolean(completed);
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "No updates provided.");
  }

  const event = await Event.findOneAndUpdate(
    withOwner(req, { _id: req.params.eventId }),
    updates,
    { new: true }
  );

  if (!event) {
    return sendError(res, 404, "NOT_FOUND", "Event not found.");
  }

  return res.json({ message: "Event updated.", event });
};

// Delete an event for the logged-in user.
const deleteEvent = async (req, res) => {
  const event = await Event.findOneAndDelete(
    withOwner(req, { _id: req.params.eventId })
  );

  if (!event) {
    return sendError(res, 404, "NOT_FOUND", "Event not found.");
  }

  return res.json({ message: "Event deleted." });
};

export { createEvent, listEvents, updateEvent, deleteEvent };
