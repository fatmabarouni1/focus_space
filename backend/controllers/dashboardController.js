import DashboardGoal from "../models/DashboardGoal.js";
import StudySession from "../models/StudySession.js";
import User from "../models/User.js";
import { sendError } from "../utils/errors.js";

const DEFAULT_TARGETS = {
  daily_sessions_target: 4,
  weekly_sessions_target: 20,
  daily_focus_minutes_target: 120,
};

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

const getStartOfWeekUtc = (date, timeZone) => {
  const parts = getDateParts(date, timeZone);
  const dayDate = toUtcDayDate(parts);
  const dayOfWeek = dayDate.getUTCDay();
  const diff = (dayOfWeek + 6) % 7;
  const start = new Date(dayDate);
  start.setUTCDate(dayDate.getUTCDate() - diff);
  return start;
};

const clampProgress = (value) => Math.min(1, Math.max(0, value));

const getOrCreateTargets = async (userId) => {
  let targets = await DashboardGoal.findOne({ user_id: userId });
  if (!targets) {
    targets = await DashboardGoal.create({
      user_id: userId,
      ...DEFAULT_TARGETS,
    });
  }
  return targets;
};


const getDashboard = async (req, res) => {
  const userId = req.user.id;
  const timeZone = getTimeZone(req);

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, "NOT_FOUND", "User not found.");
  }

  const targets = await getOrCreateTargets(userId);
  const sessions = await StudySession.find(
    { created_by: userId, status: "completed" },
    { completed_at: 1, duration_minutes: 1, end_time: 1, start_time: 1 }
  ).lean();

  const todayParts = getDateParts(new Date(), timeZone);
  const todayDate = toUtcDayDate(todayParts);
  const todayDayTime = todayDate.getTime();
  const startOfWeek = getStartOfWeekUtc(new Date(), timeZone);
  let sessionsToday = 0;
  let focusMinutesToday = 0;
  let sessionsThisWeek = 0;

  for (const session of sessions) {
    const completedAt = session.completed_at || session.end_time;
    if (!completedAt) {
      continue;
    }

    const parts = getDateParts(new Date(completedAt), timeZone);
    const dayDate = toUtcDayDate(parts);
    const dayTime = dayDate.getTime();
    if (dayTime === todayDayTime) {
      sessionsToday += 1;
      if (session.duration_minutes != null) {
        focusMinutesToday += Number(session.duration_minutes);
      } else if (session.start_time && session.end_time) {
        focusMinutesToday += Math.max(
          0,
          Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)
        );
      }
    }

    if (dayDate >= startOfWeek) {
      sessionsThisWeek += 1;
    }
  }

  const yesterdayDayTime = todayDayTime - 86400000;
  const lastActiveTime = user.lastActiveDate ? new Date(user.lastActiveDate).getTime() : null;
  let freezeTokens = Number.isFinite(user.freezeTokens) ? Number(user.freezeTokens) : 1;
  let streakCount = Number.isFinite(user.streakCount) ? Number(user.streakCount) : 0;
  let warningActive = false;
  let streakStatus = "ok";
  let shouldSave = false;

  if (freezeTokens > 2) {
    freezeTokens = 2;
    user.freezeTokens = 2;
    shouldSave = true;
  } else if (freezeTokens < 0) {
    freezeTokens = 0;
    user.freezeTokens = 0;
    shouldSave = true;
  }

  if (sessionsToday > 0) {
    streakStatus = "ok";
  } else if (lastActiveTime === todayDayTime) {
    streakStatus = "frozen";
  } else if (lastActiveTime === yesterdayDayTime) {
    warningActive = true;
    streakStatus = "warning";
  } else if (lastActiveTime != null) {
    const diffDays = Math.round((todayDayTime - lastActiveTime) / 86400000);
    if (diffDays === 2) {
      if (freezeTokens > 0) {
        freezeTokens -= 1;
        user.freezeTokens = freezeTokens;
        user.lastActiveDate = new Date(yesterdayDayTime);
        shouldSave = true;
        warningActive = true;
        streakStatus = "frozen";
      } else {
        streakCount = 0;
        user.streakCount = 0;
        user.lastActiveDate = null;
        shouldSave = true;
        streakStatus = "lost";
      }
    } else if (diffDays > 2) {
      streakCount = 0;
      user.streakCount = 0;
      user.lastActiveDate = null;
      shouldSave = true;
      streakStatus = "lost";
    } else if (diffDays === 1) {
      warningActive = true;
      streakStatus = "warning";
    }
  } else if (streakCount === 0) {
    streakStatus = "lost";
  }
  const dailySessionsTarget = targets.daily_sessions_target ?? DEFAULT_TARGETS.daily_sessions_target;
  const weeklySessionsTarget = targets.weekly_sessions_target ?? DEFAULT_TARGETS.weekly_sessions_target;
  const dailyFocusMinutesTarget =
    targets.daily_focus_minutes_target ?? DEFAULT_TARGETS.daily_focus_minutes_target;

  const dailySessionsProgress = dailySessionsTarget
    ? clampProgress(sessionsToday / dailySessionsTarget)
    : 0;
  const weeklySessionsProgress = weeklySessionsTarget
    ? clampProgress(sessionsThisWeek / weeklySessionsTarget)
    : 0;
  const dailyFocusProgress = dailyFocusMinutesTarget
    ? clampProgress(focusMinutesToday / dailyFocusMinutesTarget)
    : 0;

  if (shouldSave) {
    await user.save();
  }

  return res.json({
    targets: {
      dailySessionsTarget,
      weeklySessionsTarget,
      dailyFocusMinutesTarget,
    },
    stats: {
      sessionsToday,
      focusMinutesToday,
      sessionsThisWeek,
    },
    streaks: {
      streakCount,
      freezeTokens,
      warningActive,
      streakStatus,
    },
    progress: {
      dailySessionsProgress,
      weeklySessionsProgress,
      dailyFocusProgress,
    },
    timeZone,
  });
};

const updateTargets = async (req, res) => {
  const userId = req.user.id;
  const { dailySessionsTarget, weeklySessionsTarget, dailyFocusMinutesTarget } = req.body;
  const updates = {};

  if (dailySessionsTarget !== undefined) {
    updates.daily_sessions_target = Number(dailySessionsTarget);
  }
  if (weeklySessionsTarget !== undefined) {
    updates.weekly_sessions_target = Number(weeklySessionsTarget);
  }
  if (dailyFocusMinutesTarget !== undefined) {
    updates.daily_focus_minutes_target = Number(dailyFocusMinutesTarget);
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "No updates provided.");
  }

  const targets = await getOrCreateTargets(userId);
  Object.assign(targets, updates);
  await targets.save();

  return res.json({
    message: "Targets updated.",
    targets: {
      dailySessionsTarget: targets.daily_sessions_target,
      weeklySessionsTarget: targets.weekly_sessions_target,
      dailyFocusMinutesTarget: targets.daily_focus_minutes_target,
    },
  });
};

const useFreezeToken = async (req, res) => {
  const userId = req.user.id;
  const timeZone = getTimeZone(req);
  const user = await User.findById(userId);

  if (!user) {
    return sendError(res, 404, "NOT_FOUND", "User not found.");
  }

  const todayDate = toUtcDayDate(getDateParts(new Date(), timeZone));
  const todayDayTime = todayDate.getTime();
  const yesterdayDayTime = todayDayTime - 86400000;
  const lastActiveTime = user.lastActiveDate ? new Date(user.lastActiveDate).getTime() : null;
  const freezeTokens = Number.isFinite(user.freezeTokens) ? Number(user.freezeTokens) : 1;

  if (lastActiveTime !== yesterdayDayTime) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Freeze token can only be used during warning."
    );
  }

  if (freezeTokens <= 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "No freeze tokens available.");
  }

  user.freezeTokens = freezeTokens - 1;
  user.lastActiveDate = new Date(todayDayTime);
  await user.save();

  return res.json({
    message: "Freeze token used.",
    streaks: {
      streakCount: Number.isFinite(user.streakCount) ? Number(user.streakCount) : 0,
      freezeTokens: user.freezeTokens,
      warningActive: false,
      streakStatus: "frozen",
    },
  });
};

export { getDashboard, updateTargets, useFreezeToken };
