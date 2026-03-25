import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  listSuggestions,
  createSuggestion,
  deleteSuggestion,
} from "../controllers/suggestionsController.js";
import { suggestionSchemas } from "../validators/index.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  validate({ query: suggestionSchemas.listQuery }),
  listSuggestions
);
router.post(
  "/",
  authMiddleware,
  validate({ body: suggestionSchemas.createBody }),
  createSuggestion
);
router.delete(
  "/:id",
  authMiddleware,
  validate({ params: suggestionSchemas.deleteParams }),
  deleteSuggestion
);

export default router;
