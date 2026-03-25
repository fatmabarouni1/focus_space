import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  chatWithDocument,
  ensureStudyUploadsDir,
  generateQuiz,
  getRecommendations,
  reindexDocument,
  submitQuiz,
  uploadAndProcessDocument,
} from "../controllers/studyCompanionController.js";
import { studyCompanionSchemas } from "../validators/index.js";

ensureStudyUploadsDir();

const upload = multer({
  dest: "uploads/",
});

const router = express.Router();

router.post(
  "/modules/:moduleId/documents/upload",
  authMiddleware,
  validate({ params: studyCompanionSchemas.moduleIdParams }),
  upload.single("file"),
  uploadAndProcessDocument
);

router.post(
  "/documents/:documentId/reindex",
  authMiddleware,
  validate({ params: studyCompanionSchemas.documentIdParams }),
  reindexDocument
);

router.post(
  "/chat",
  authMiddleware,
  validate({
    body: studyCompanionSchemas.chatBody,
    query: studyCompanionSchemas.chatQuery,
  }),
  chatWithDocument
);

router.post(
  "/generate-quiz",
  authMiddleware,
  validate({ body: studyCompanionSchemas.generateQuizBody }),
  generateQuiz
);

router.post(
  "/submit-quiz",
  authMiddleware,
  validate({ body: studyCompanionSchemas.submitQuizBody }),
  submitQuiz
);

router.get("/recommendations", authMiddleware, getRecommendations);

export default router;
