import express from "express";
import {
  register,
  registerInitiate,
  registerVerify,
  login,
  requestPasswordReset,
  verifyPasswordReset,
  refresh,
  logout,
  me,
} from "../controllers/authController.js";
import requireAuth from "../middleware/authMiddleware.js";
import {
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import { authSchemas } from "../validators/index.js";

const router = express.Router();

// Auth routes (public).
router.post("/register", registerRateLimiter, validate({ body: authSchemas.register }), register);
router.post(
  "/register/initiate",
  registerRateLimiter,
  validate({ body: authSchemas.registerInitiate }),
  registerInitiate
);
router.post(
  "/register/verify",
  validate({ body: authSchemas.registerVerify }),
  registerVerify
);
router.post("/login", loginRateLimiter, validate({ body: authSchemas.login }), login);
router.post(
  "/password-reset/request",
  resetPasswordRateLimiter,
  validate({ body: authSchemas.passwordResetRequest }),
  requestPasswordReset
);
router.post(
  "/password-reset/verify",
  validate({ body: authSchemas.passwordResetVerify }),
  verifyPasswordReset
);
router.post("/refresh", refreshRateLimiter, refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
