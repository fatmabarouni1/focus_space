import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { eventSchemas } from "../validators/index.js";

const router = express.Router();

// Calendar event routes (protected).
router.get("/", authMiddleware, listEvents);
router.post(
  "/",
  authMiddleware,
  validate({ body: eventSchemas.createBody }),
  createEvent
);
router.patch(
  "/:eventId",
  authMiddleware,
  validate({ params: eventSchemas.eventIdParams, body: eventSchemas.updateBody }),
  updateEvent
);
router.delete(
  "/:eventId",
  authMiddleware,
  validate({ params: eventSchemas.eventIdParams }),
  deleteEvent
);

export default router;
