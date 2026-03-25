import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";
import { noteSchemas } from "../validators/index.js";

const router = express.Router();

// Note routes (protected).
router.post(
  "/",
  authMiddleware,
  validate({ body: noteSchemas.createBody }),
  createNote
);
router.get("/", authMiddleware, listNotes);
router.patch(
  "/:noteId",
  authMiddleware,
  validate({ params: noteSchemas.noteIdParams, body: noteSchemas.updateBody }),
  updateNote
);
router.delete(
  "/:noteId",
  authMiddleware,
  validate({ params: noteSchemas.noteIdParams }),
  deleteNote
);

export default router;
