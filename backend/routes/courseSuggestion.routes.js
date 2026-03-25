import express from "express";
import {
  createSuggestion,
  listSuggestions,
} from "../controllers/courseSuggestionController.js";
import validate from "../middleware/validate.js";
import { courseSuggestionSchemas } from "../validators/index.js";

const router = express.Router();

// Course suggestion routes (public).
router.get("/coursesuggestions", listSuggestions);
router.post(
  "/coursesuggestions",
  validate({ body: courseSuggestionSchemas.createBody }),
  createSuggestion
);

export default router;
