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
import validate from "../middleware/validate.js";
import { authSchemas } from "../validators/index.js";

const router = express.Router();

// Auth routes (public).
router.post("/register", validate({ body: authSchemas.register }), register);
router.post(
  "/register/initiate",
  validate({ body: authSchemas.registerInitiate }),
  registerInitiate
);
router.post(
  "/register/verify",
  validate({ body: authSchemas.registerVerify }),
  registerVerify
);
router.post("/login", validate({ body: authSchemas.login }), login);
router.post(
  "/password-reset/request",
  validate({ body: authSchemas.passwordResetRequest }),
  requestPasswordReset
);
router.post(
  "/password-reset/verify",
  validate({ body: authSchemas.passwordResetVerify }),
  verifyPasswordReset
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
