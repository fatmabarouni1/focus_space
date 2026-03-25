import StudySession from "../models/StudySession.js";
import SessionParticipant from "../models/SessionParticipant.js";
import User from "../models/User.js";
import { sendError } from "../utils/errors.js";

const getTimeZone = (req) => {
  const headerTz = req.headers["x-timezone"];
  if (typeof headerTz !== "string" || !headerTz.trim()) {
    return "UTC";
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: headerTz }).format();
    return headerTz;
  } catch {
    return "UTC";
  }
};

const getDateParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const mapped = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(mapped.year),
    month: Number(mapped.month),
    day: Number(mapped.day),
  };
};

const toUtcDayDate = (parts) =>
  new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

// Create a new study session (solo or group).
const createSession = async (req, res) => {
  const { title, type, start_time, end_time } = req.body;

  if (!title || !type) {
    return sendError(res, 400, "VALIDATION_ERROR", "Title and type are required.");
  }

  const session = await StudySession.create({
    title,
    type,
    created_by: req.user.id,
    start_time: start_time || Date.now(),
    end_time: end_time || null,
    status: end_time ? "completed" : "active",
    completed_at: end_time || null,
    duration_minutes: end_time && start_time
      ? Math.max(0, Math.round((new Date(end_time) - new Date(start_time)) / 60000))
      : null,
  });

  await SessionParticipant.create({
    session_id: session._id,
    user_id: req.user.id,
  });

  return res.status(201).json({
    message: "Study session created.",
    session,
  });
};

// Record a completed study session (from timer).
const completeSession = async (req, res) => {
  const { title, duration_minutes, completed_at, start_time } = req.body;

  if (!duration_minutes || Number(duration_minutes) <= 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Duration is required.");
  }

  const completedAt = completed_at ? new Date(completed_at) : new Date();
  const startTime = start_time
    ? new Date(start_time)
    : new Date(completedAt.getTime() - Number(duration_minutes) * 60000);

  const timeZone = getTimeZone(req);
  const completedDayTime = toUtcDayDate(getDateParts(completedAt, timeZone)).getTime();
  const yesterdayDayTime = completedDayTime - 86400000;

  const session = await StudySession.create({
    title: title?.trim() || "Focus Session",
    type: "solo",
    created_by: req.user.id,
    is_active: false,
    status: "completed",
    start_time: startTime,
    end_time: completedAt,
    completed_at: completedAt,
    duration_minutes: Number(duration_minutes),
  });

  const user = await User.findById(req.user.id);
  if (user) {
    const lastActiveTime = user.lastActiveDate ? new Date(user.lastActiveDate).getTime() : null;
    let streakCount = Number.isFinite(user.streakCount) ? Number(user.streakCount) : 0;
    let freezeTokens = Number.isFinite(user.freezeTokens) ? Number(user.freezeTokens) : 1;

    if (lastActiveTime === completedDayTime) {
      user.lastActiveDate = new Date(completedDayTime);
    } else if (lastActiveTime === yesterdayDayTime) {
      streakCount += 1;
      user.streakCount = streakCount;
      user.lastActiveDate = new Date(completedDayTime);
    } else if (lastActiveTime != null) {
      const diffDays = Math.round((completedDayTime - lastActiveTime) / 86400000);
      if (diffDays === 2 && freezeTokens > 0) {
        freezeTokens -= 1;
        user.freezeTokens = freezeTokens;
        streakCount += 1;
        user.streakCount = streakCount;
        user.lastActiveDate = new Date(completedDayTime);
      } else if (diffDays > 1) {
        user.streakCount = 1;
        user.lastActiveDate = new Date(completedDayTime);
      } else {
        user.lastActiveDate = new Date(completedDayTime);
      }
    } else {
      user.streakCount = 1;
      user.lastActiveDate = new Date(completedDayTime);
    }

    await user.save();
  }

  return res.status(201).json({
    message: "Session completed.",
    session,
  });
};

// Join an existing study session.
const joinSession = async (req, res) => {
  const { sessionId } = req.params;

  const session = await StudySession.findById(sessionId);
  if (!session || !session.is_active) {
    return sendError(res, 404, "NOT_FOUND", "Session not found or inactive.");
  }

  const existing = await SessionParticipant.findOne({
    session_id: sessionId,
    user_id: req.user.id,
  });

  if (existing) {
    return res.status(200).json({ message: "Already joined this session." });
  }

  const participant = await SessionParticipant.create({
    session_id: sessionId,
    user_id: req.user.id,
  });

  return res.status(201).json({
    message: "Joined session successfully.",
    participant,
  });
};

// Leave a study session.
const leaveSession = async (req, res) => {
  const { sessionId } = req.params;

  const result = await SessionParticipant.findOneAndDelete({
    session_id: sessionId,
    user_id: req.user.id,
  });

  if (!result) {
    return sendError(res, 404, "NOT_FOUND", "Not part of this session.");
  }

  return res.json({ message: "Left session successfully." });
};

export { createSession, joinSession, leaveSession, completeSession };
