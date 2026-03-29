import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";
import config from "../config/index.js";

const isDevelopment = config.env === "development";

const toRetryAfterSeconds = (resetTime) => {
  if (!resetTime) return null;
  const resetMs = new Date(resetTime).getTime() - Date.now();
  if (Number.isNaN(resetMs) || resetMs <= 0) return 1;
  return Math.max(1, Math.ceil(resetMs / 1000));
};

const createJsonLimiter = ({ windowMs, limit, message }) => {
  if (isDevelopment) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = toRetryAfterSeconds(req.rateLimit?.resetTime);
      logger.warn("Rate limit hit", {
        event: "rate_limit_hit",
        route: req.originalUrl,
        ip: req.ip,
        method: req.method,
        requestId: req.requestId,
      });
      if (retryAfter) {
        res.set("Retry-After", String(retryAfter));
      }
      return res.status(429).json({ error: message });
    },
  });
};

export const loginRateLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many attempts, try again in 15 minutes",
});

export const registerRateLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: "Too many registration attempts, try again in 1 hour",
});

export const resetPasswordRateLimiter = createJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: "Too many password reset attempts, try again in 1 hour",
});

export const refreshRateLimiter = createJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many refresh attempts, try again in 15 minutes",
});
