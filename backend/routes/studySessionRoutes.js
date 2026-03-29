import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import paginateMiddleware from "../middleware/paginateMiddleware.js";
import validate from "../middleware/validate.js";
import {
  listSessions,
  createSession,
  joinSession,
  leaveSession,
  completeSession,
} from "../controllers/studySessionController.js";
import { studySessionSchemas } from "../validators/index.js";

const router = express.Router();

// Study session routes (protected).
router.get("/", authMiddleware, paginateMiddleware("cursor"), listSessions);
router.post(
  "/",
  authMiddleware,
  validate({ body: studySessionSchemas.createBody }),
  createSession
);
router.post(
  "/complete",
  authMiddleware,
  validate({ body: studySessionSchemas.completeBody }),
  completeSession
);
router.post(
  "/:sessionId/join",
  authMiddleware,
  validate({ params: studySessionSchemas.sessionIdParams }),
  joinSession
);
router.post(
  "/:sessionId/leave",
  authMiddleware,
  validate({ params: studySessionSchemas.sessionIdParams }),
  leaveSession
);

export default router;
