import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  setPreference,
  getPreference,
} from "../controllers/musicPreferenceController.js";
import { musicSchemas } from "../validators/index.js";

const router = express.Router();

// Music preference routes (protected).
router.put(
  "/",
  authMiddleware,
  validate({ body: musicSchemas.setPreferenceBody }),
  setPreference
);
router.get("/", authMiddleware, getPreference);

export default router;
