import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import User from "../models/User.js";
import { sendError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { createPaginationEnvelope } from "../utils/paginate.js";

const sanitizeTitle = (value) =>
  value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const validateTitle = (title) => title.length >= 3 && title.length <= 60;

const toRoomSummary = (room, host) => ({
  _id: room._id,
  title: room.title,
  status: room.status,
  participantsCount: room.participants_count ?? 0,
  host: host
    ? {
        id: host._id,
        name: host.name,
      }
    : null,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const createRoom = async (req, res) => {
  const rawTitle = typeof req.body?.title === "string" ? req.body.title : "";
  const title = sanitizeTitle(rawTitle);

  if (!validateTitle(title)) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Title must be between 3 and 60 characters."
    );
  }

  const room = await Room.create({
    title,
    host_user_id: req.user.id,
    status: "focus",
    participants_count: 1,
    is_active: true,
  });

  await RoomParticipant.create({
    room_id: room._id,
    user_id: req.user.id,
    status: "focus",
  });

  const host = await User.findById(req.user.id);

  logger.info("Room created", {
    roomId: room._id.toString(),
    title: room.title,
    hostUserId: req.user.id,
    hostName: host?.name ?? "Unknown",
    requestId: req.requestId,
  });

  return res.status(201).json({
    message: "Room created.",
    room: toRoomSummary(room, host),
  });
};

const listRooms = async (req, res) => {
  const limit = req.pagination?.limit ?? 20;
  const cursor = req.pagination?.cursor;
  const roomFilter = { is_active: true };

  if (cursor) {
    roomFilter._id = { $lt: cursor };
  }

  logger.info("Room list fetch requested", {
    userId: req.user.id,
    cursor: cursor ?? null,
    limit,
    requestId: req.requestId,
  });

  const rooms = await Room.find(roomFilter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("host_user_id", "name")
    .lean();

  const hasMore = rooms.length > limit;
  const pageRooms = hasMore ? rooms.slice(0, limit) : rooms;
  const data = pageRooms.map((room) => toRoomSummary(room, room.host_user_id));
  const total = await Room.countDocuments({ is_active: true });

  logger.info("Room list fetch completed", {
    userId: req.user.id,
    returnedRooms: data.length,
    totalActiveRooms: total,
    requestId: req.requestId,
  });

  return res.json(
    createPaginationEnvelope(data, {
      hasMore,
      nextCursor: hasMore
        ? String(pageRooms[pageRooms.length - 1]?._id ?? "")
        : null,
      total,
      limit,
    })
  );
};

const getRoom = async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findById(roomId).populate("host_user_id", "name");
  if (!room || !room.is_active) {
    return sendError(res, 404, "NOT_FOUND", "Room not found or inactive.");
  }

  const participants = await RoomParticipant.find({ room_id: roomId })
    .populate("user_id", "name")
    .sort({ joined_at: 1 })
    .lean();

  return res.json({
    room: toRoomSummary(room, room.host_user_id),
    participants: participants.map((participant) => ({
      id: participant.user_id?._id || participant.user_id,
      name: participant.user_id?.name || "Participant",
      status: participant.status,
      joinedAt: participant.joined_at,
    })),
  });
};

const joinRoom = async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findById(roomId);
  if (!room || !room.is_active) {
    return sendError(res, 404, "NOT_FOUND", "Room not found or inactive.");
  }

  const existing = await RoomParticipant.findOne({
    room_id: roomId,
    user_id: req.user.id,
  });

  if (existing) {
    return res.status(200).json({ message: "Already joined this room." });
  }

  await RoomParticipant.create({
    room_id: roomId,
    user_id: req.user.id,
    status: room.status,
  });

  const participantsCount = await RoomParticipant.countDocuments({ room_id: roomId });

  await Room.findByIdAndUpdate(roomId, {
    participants_count: participantsCount,
    is_active: true,
  });

  return res.status(201).json({ message: "Joined room successfully." });
};

const leaveRoom = async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findById(roomId);
  if (!room) {
    return sendError(res, 404, "NOT_FOUND", "Room not found.");
  }

  const removed = await RoomParticipant.findOneAndDelete({
    room_id: roomId,
    user_id: req.user.id,
  });

  if (!removed) {
    return sendError(res, 404, "NOT_FOUND", "Not part of this room.");
  }

  if (String(room.host_user_id) === String(req.user.id)) {
    await RoomParticipant.deleteMany({ room_id: roomId });
    await Room.findByIdAndUpdate(roomId, {
      participants_count: 0,
      status: "idle",
      is_active: false,
    });
    return res.json({ message: "Host left. Room is now inactive." });
  }

  const participantsCount = await RoomParticipant.countDocuments({ room_id: roomId });
  const isActive = participantsCount > 0;

  await Room.findByIdAndUpdate(roomId, {
    participants_count: participantsCount,
    status: isActive ? room.status : "idle",
    is_active: isActive,
  });

  return res.json({ message: "Left room successfully." });
};

export { createRoom, listRooms, getRoom, joinRoom, leaveRoom };
