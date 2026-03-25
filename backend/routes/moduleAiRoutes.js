import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  generateResources,
  generateSummary,
  generateQuiz,
} from "../controllers/moduleAiController.js";
import { aiSchemas } from "../validators/index.js";

const router = express.Router();

router.post(
  "/modules/:moduleId/ai/summary",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams }),
  generateSummary
);
router.post(
  "/modules/:moduleId/ai/quiz",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams }),
  generateQuiz
);
router.post(
  "/modules/:moduleId/ai/resources",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams }),
  generateResources
);

export default router;
