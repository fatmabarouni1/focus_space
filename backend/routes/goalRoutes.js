import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createGoal,
  listGoals,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";
import { goalSchemas } from "../validators/index.js";

const router = express.Router();

// Custom goal routes (protected).
router.get("/", authMiddleware, listGoals);
router.post(
  "/",
  authMiddleware,
  validate({ body: goalSchemas.createBody }),
  createGoal
);
router.patch(
  "/:goalId",
  authMiddleware,
  validate({ params: goalSchemas.goalIdParams, body: goalSchemas.updateBody }),
  updateGoal
);
router.delete(
  "/:goalId",
  authMiddleware,
  validate({ params: goalSchemas.goalIdParams }),
  deleteGoal
);

export default router;
