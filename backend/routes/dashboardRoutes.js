import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { getDashboard, updateTargets, useFreezeToken } from "../controllers/dashboardController.js";
import { dashboardSchemas } from "../validators/index.js";

const router = express.Router();

// Dashboard data (protected).
router.get("/", authMiddleware, getDashboard);
router.patch(
  "/targets",
  authMiddleware,
  validate({ body: dashboardSchemas.updateTargetsBody }),
  updateTargets
);
router.post("/streaks/freeze", authMiddleware, useFreezeToken);

export default router;
