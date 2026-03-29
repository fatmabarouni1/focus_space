import jwt from "jsonwebtoken";
import config from "../config/index.js";

// Verifies an access token and attaches user data to the request.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const jwtSecret = config.jwt.secret;

  if (!token) {
    return res.status(401).json({ message: "Access token missing." });
  }

  if (!jwtSecret) {
    return res.status(500).json({ message: "JWT secret is not configured." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: payload.userId,
      email: payload.email ?? null,
      role: payload.role ?? "user",
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token." });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden." });
  }

  return next();
};

export default authMiddleware;
