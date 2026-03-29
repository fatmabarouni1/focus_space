import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import paginateMiddleware from "../middleware/paginateMiddleware.js";
import validate from "../middleware/validate.js";
import {
  generateResources,
  generateSummary,
  generateQuiz,
  generateKeywords,
  getModuleAiOutputs,
  saveModuleAiOutput,
} from "../controllers/moduleAiController.js";
import { searchModuleResources } from "../controllers/resourceSearchController.js";
import {
  getNote,
  listDocuments,
  listModules,
  listResources,
} from "../controllers/revisionController.js";
import { aiSchemas, moduleSchemas } from "../validators/index.js";

const router = express.Router();

router.get("/modules", authMiddleware, paginateMiddleware("cursor"), listModules);
router.get(
  "/modules/:moduleId/notes",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  getNote
);
router.get(
  "/modules/:moduleId/documents",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  listDocuments
);
router.get(
  "/modules/:moduleId/resources",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  listResources
);

router.get(
  "/modules/:moduleId/ai",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams }),
  getModuleAiOutputs
);
router.post(
  "/modules/:moduleId/resources/search",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams, body: aiSchemas.resourceSearchBody }),
  searchModuleResources
);
router.post(
  "/modules/:moduleId/ai/save",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams, body: aiSchemas.saveOutputBody }),
  saveModuleAiOutput
);
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
router.post(
  "/modules/:moduleId/ai/keywords",
  authMiddleware,
  validate({ params: aiSchemas.moduleIdParams }),
  generateKeywords
);

export default router;
