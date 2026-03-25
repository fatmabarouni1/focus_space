import Note from "../models/Note.js";
import { withOwner } from "../utils/ownership.js";
import { sendError } from "../utils/errors.js";

// Create a personal or AI-generated note.
const createNote = async (req, res) => {
  const { title, content, ai_generated } = req.body;

  if (content === undefined || content === null) {
    return sendError(res, 400, "VALIDATION_ERROR", "Content is required.");
  }

  const note = await Note.create({
    title: title?.trim() || "Untitled Note",
    content,
    ai_generated: Boolean(ai_generated),
    user_id: req.user.id,
  });

  return res.status(201).json({ message: "Note created.", note });
};

// List notes for the logged-in user.
const listNotes = async (req, res) => {
  const notes = await Note.find({ user_id: req.user.id }).sort({ created_at: -1 });
  return res.json({ notes });
};

// Update an existing note for the logged-in user.
const updateNote = async (req, res) => {
  const { title, content, ai_generated } = req.body;
  const updates = {};

  if (title !== undefined) {
    updates.title = title?.trim() || "Untitled Note";
  }
  if (content !== undefined) {
    updates.content = content;
  }
  if (ai_generated !== undefined) {
    updates.ai_generated = Boolean(ai_generated);
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "No updates provided.");
  }

  const note = await Note.findOneAndUpdate(
    withOwner(req, { _id: req.params.noteId }),
    updates,
    { new: true }
  );

  if (!note) {
    return sendError(res, 404, "NOT_FOUND", "Note not found.");
  }

  return res.json({ message: "Note updated.", note });
};

// Delete a note for the logged-in user.
const deleteNote = async (req, res) => {
  const note = await Note.findOneAndDelete(
    withOwner(req, { _id: req.params.noteId })
  );

  if (!note) {
    return sendError(res, 404, "NOT_FOUND", "Note not found.");
  }

  return res.json({ message: "Note deleted." });
};

export { createNote, listNotes, updateNote, deleteNote };
