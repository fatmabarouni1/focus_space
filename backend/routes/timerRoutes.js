import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { createTimer, listTimers } from "../controllers/timerController.js";
import { timerSchemas } from "../validators/index.js";

const router = express.Router();

// Timer routes (protected).
router.post(
  "/",
  authMiddleware,
  validate({ body: timerSchemas.createBody }),
  createTimer
);
router.get("/", authMiddleware, listTimers);

export default router;
