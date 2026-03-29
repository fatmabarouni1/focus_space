import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import User from "../models/User.js";
import RevisionModule from "../models/RevisionModule.js";
import ModuleNote from "../models/ModuleNote.js";
import ModuleDocument from "../models/ModuleDocument.js";
import ModuleLink from "../models/ModuleLink.js";
import ModuleAIOutput from "../models/ModuleAIOutput.js";
import ModuleResourceSuggestion from "../models/ModuleResourceSuggestion.js";
import StudySession from "../models/StudySession.js";
import Goal from "../models/Goal.js";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import RefreshToken from "../models/RefreshToken.js";
import { sendError } from "../utils/errors.js";
import { logsDir } from "../utils/logger.js";

// GET /api/admin/users?page=&limit=&search=
const listUsers = async (req, res) => {
  try {
    const page = req.pagination?.page ?? 1;
    const limit = req.pagination?.limit ?? 20;
    const search = (req.query.search || "").toString().trim();

    const filter = search
      ? { email: { $regex: search, $options: "i" } }
      : {};

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("email role created_at"),
    ]);

    return res.json({
      success: true,
      data: users.map((user) => ({
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      })),
      pagination: {
        hasMore: page * limit < total,
        nextCursor: page * limit < total ? String(page + 1) : null,
        total,
        limit,
      },
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to list users.");
  }
};

// PATCH /api/admin/users/:id/role { role: "user" | "admin" }
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid user id.");
    }

    if (!["user", "admin"].includes(role)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Role must be user or admin.");
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("email role created_at");

    if (!user) {
      return sendError(res, 404, "NOT_FOUND", "User not found.");
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to update role.");
  }
};

const listIndexes = async (req, res) => {
  try {
    const models = [
      { collection: "users", model: User },
      { collection: "modules", model: RevisionModule },
      { collection: "notes", model: ModuleNote },
      { collection: "documents", model: ModuleDocument },
      { collection: "links", model: ModuleLink },
      { collection: "aiResults", model: ModuleAIOutput },
      { collection: "resources", model: ModuleResourceSuggestion },
      { collection: "sessions", model: StudySession },
      { collection: "goals", model: Goal },
      { collection: "rooms", model: Room },
      { collection: "roomParticipants", model: RoomParticipant },
      { collection: "refreshTokens", model: RefreshToken },
    ];

    const collections = await Promise.all(
      models.map(async ({ collection, model }) => ({
        collection,
        indexes: await model.collection.indexes(),
      }))
    );

    return res.json({ collections });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to list indexes.");
  }
};

const listLogs = async (req, res) => {
  try {
    const errorLogPath = path.join(logsDir, "error.log");
    const content = await readFile(errorLogPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") {
        return "";
      }
      throw error;
    });
    const lines = content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-100);

    return res.json({
      lines,
      count: lines.length,
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to read error logs.");
  }
};

const getPaginationStats = async (_req, res) => {
  try {
    const [modules, notes, documents, rooms, sessions, users] = await Promise.all([
      RevisionModule.countDocuments(),
      ModuleNote.countDocuments(),
      ModuleDocument.countDocuments(),
      Room.countDocuments(),
      StudySession.countDocuments(),
      User.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        modules,
        notes,
        documents,
        rooms,
        sessions,
        users,
      },
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to load pagination stats.");
  }
};

export { listUsers, updateUserRole, listIndexes, listLogs, getPaginationStats };
