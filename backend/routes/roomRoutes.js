import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import paginateMiddleware from "../middleware/paginateMiddleware.js";
import validate from "../middleware/validate.js";
import {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  leaveRoom,
} from "../controllers/roomController.js";
import { roomSchemas } from "../validators/index.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  validate({ body: roomSchemas.createBody }),
  createRoom
);
router.get("/", authMiddleware, paginateMiddleware("cursor"), listRooms);
router.get(
  "/:roomId",
  authMiddleware,
  validate({ params: roomSchemas.roomIdParams }),
  getRoom
);
router.post(
  "/:roomId/join",
  authMiddleware,
  validate({ params: roomSchemas.roomIdParams }),
  joinRoom
);
router.post(
  "/:roomId/leave",
  authMiddleware,
  validate({ params: roomSchemas.roomIdParams }),
  leaveRoom
);

export default router;
