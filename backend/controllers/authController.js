import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OtpChallenge from "../models/OtpChallenge.js";
import { sendError } from "../utils/errors.js";
import { hasSmtpConfig, sendOtpEmail } from "../utils/mailer.js";

const ACCESS_TOKEN_TTL =
  process.env.ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
const isProduction = process.env.NODE_ENV === "production";
const allowLocalOtpLog =
  !isProduction &&
  (process.env.ALLOW_LOCAL_OTP_LOG || "").toLowerCase() === "true";
const cookieSameSite =
  process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");

const OTP_LENGTH = 6;
const OTP_MAX_ATTEMPTS = 3;
const OTP_TTL_MS = 10 * 60 * 1000;

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const createRefreshToken = () => crypto.randomBytes(64).toString("hex");

const createOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isStrongPassword = (value) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

const getContactFromBody = ({ method, email, phone }) => {
  if (method === "email") return { email: email?.toLowerCase() ?? null, phone: null };
  return { email: null, phone: phone?.trim() ?? null };
};

const normalizeOtp = (value) => String(value ?? "").trim();

const buildOtpQuery = ({ purpose, method, email, phone }) => ({
  purpose,
  method,
  email: method === "email" ? email?.toLowerCase() ?? null : null,
  phone: method === "sms" ? phone?.trim() ?? null : null,
});

const buildSecureOtpResponse = (message = "Verification code sent successfully") => ({
  success: true,
  message,
});

const debugOtp = (message, details = {}) => {
  if (isProduction) {
    return;
  }
  console.log(`[OTP_DEBUG] ${message}`, details);
};

const logOtpForLocalDebug = ({ purpose, destination, code }) => {
  if (!allowLocalOtpLog) {
    return;
  }
  console.log(`[OTP:${purpose}] -> ${destination}: ${code}`);
};

const sendOtpCode = async ({ method, email, phone, code, purpose }) => {
  const destination = method === "email" ? email : phone;

  if (method === "email") {
    if (!hasSmtpConfig()) {
      throw new Error("Email verification is not configured on the server.");
    }
    await sendOtpEmail({ email, code, purpose });
    return;
  }

  // SMS remains a development placeholder until a provider is integrated.
  logOtpForLocalDebug({ purpose, destination: `${method.toUpperCase()} ${destination}`, code });
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    path: "/api/auth",
  });
};

const issueAuthTokens = async (res, user) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  user.refreshToken = hashRefreshToken(refreshToken);
  await user.save();
  setRefreshCookie(res, refreshToken);
  return accessToken;
};

const createOrReplaceOtpChallenge = async ({
  purpose,
  method,
  email,
  phone,
  pendingData = null,
}) => {
  const otp = createOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const query = buildOtpQuery({ purpose, method, email, phone });

  const challenge = await OtpChallenge.findOneAndUpdate(
    query,
    {
      $set: {
        verificationCode: otp,
        verificationCodeExpiresAt: expiresAt,
        verificationAttempts: 0,
        pendingData,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  debugOtp("OTP generated", {
    purpose,
    method,
    email: query.email,
    phone: query.phone,
    expiresAt: expiresAt.toISOString(),
    challengeId: challenge._id.toString(),
  });

  try {
    await sendOtpCode({ method, email: query.email, phone: query.phone, code: otp, purpose });
    debugOtp("OTP saved and delivery completed", {
      purpose,
      method,
      email: query.email,
      phone: query.phone,
      challengeId: challenge._id.toString(),
    });
    return challenge;
  } catch (error) {
    debugOtp("OTP delivery failed; challenge removed", {
      purpose,
      method,
      email: query.email,
      phone: query.phone,
      reason: error.message,
    });
    await OtpChallenge.deleteOne({ _id: challenge._id });
    throw error;
  }
};

const consumeOtpChallenge = async ({ purpose, method, email, phone, otp }) => {
  const query = buildOtpQuery({ purpose, method, email, phone });
  const normalizedOtp = normalizeOtp(otp);
  debugOtp("Verification requested", {
    purpose,
    method,
    email: query.email,
    phone: query.phone,
    otpLength: normalizedOtp.length,
  });
  const challenge = await OtpChallenge.findOne(query);

  if (!challenge) {
    debugOtp("Verification failed: challenge not found", query);
    return {
      ok: false,
      status: 404,
      code: "OTP_NOT_FOUND",
      message: "Verification code not found.",
    };
  }

  debugOtp("Verification challenge found", {
    challengeId: challenge._id.toString(),
    hasCode: Boolean(challenge.verificationCode),
    expiresAt: challenge.verificationCodeExpiresAt?.toISOString?.(),
    attempts: challenge.verificationAttempts,
  });

  if (!challenge.verificationCode) {
    debugOtp("Verification failed: code missing on challenge", {
      challengeId: challenge._id.toString(),
    });
    return {
      ok: false,
      status: 404,
      code: "OTP_NOT_FOUND",
      message: "Verification code not found.",
    };
  }

  if (challenge.verificationAttempts >= OTP_MAX_ATTEMPTS) {
    debugOtp("Verification failed: attempts exceeded", {
      challengeId: challenge._id.toString(),
      attempts: challenge.verificationAttempts,
    });
    return { ok: false, status: 423, code: "OTP_LOCKED", message: "Too many attempts. Request a new code." };
  }

  if (challenge.verificationCodeExpiresAt <= new Date()) {
    debugOtp("Verification failed: code expired", {
      challengeId: challenge._id.toString(),
      expiresAt: challenge.verificationCodeExpiresAt.toISOString(),
    });
    await OtpChallenge.deleteOne({ _id: challenge._id });
    return {
      ok: false,
      status: 400,
      code: "OTP_EXPIRED",
      message: "Verification code expired.",
    };
  }

  if (challenge.verificationCode !== normalizedOtp) {
    challenge.verificationAttempts += 1;
    await challenge.save();
    const locked = challenge.verificationAttempts >= OTP_MAX_ATTEMPTS;
    debugOtp("Verification failed: code mismatch", {
      challengeId: challenge._id.toString(),
      attempts: challenge.verificationAttempts,
      locked,
    });
    return {
      ok: false,
      status: locked ? 423 : 400,
      code: locked ? "OTP_LOCKED" : "INVALID_OTP",
      message: locked ? "Too many attempts. Request a new code." : "Invalid verification code.",
    };
  }

  debugOtp("Verification code matched", {
    challengeId: challenge._id.toString(),
  });
  return { ok: true, challenge };
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "VALIDATION_ERROR", "Name, email, and password are required.");
    }

    if (!isStrongPassword(password)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Password does not meet complexity requirements.");
    }

    if (!hasSmtpConfig()) {
      return sendError(
        res,
        503,
        "EMAIL_NOT_CONFIGURED",
        "Email verification is not configured on the server."
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, "ACCOUNT_EXISTS", "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await createOrReplaceOtpChallenge({
      purpose: "register",
      method: "email",
      email: email.toLowerCase(),
      phone: null,
      pendingData: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: null,
      },
    });

    return res.status(202).json(
      buildSecureOtpResponse("Verification code sent successfully")
    );
  } catch (error) {
    console.error("register error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to register user.");
  }
};

const registerInitiate = async (req, res) => {
  try {
    const { name, email, password, method, phone } = req.body;
    const contact = getContactFromBody({ method, email, phone });

    if (method === "email" && !contact.email) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email is required for email verification.");
    }
    if (method === "sms" && !contact.phone) {
      return sendError(res, 400, "VALIDATION_ERROR", "Phone number is required for SMS verification.");
    }
    if (!isStrongPassword(password)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Password does not meet complexity requirements.");
    }
    if (method === "email" && !hasSmtpConfig()) {
      return sendError(
        res,
        503,
        "EMAIL_NOT_CONFIGURED",
        "Email verification is not configured on the server."
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, "ACCOUNT_EXISTS", "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await createOrReplaceOtpChallenge({
      purpose: "register",
      method,
      ...contact,
      pendingData: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone?.trim() || null,
      },
    });

    return res.json(buildSecureOtpResponse("Verification code sent successfully"));
  } catch (error) {
    console.error("registerInitiate error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to process verification request.");
  }
};

const registerVerify = async (req, res) => {
  try {
    const { email, method, otp, phone } = req.body;
    const contact = getContactFromBody({ method, email, phone });
    debugOtp("Register verify endpoint called", {
      method,
      email: contact.email,
      phone: contact.phone,
    });

    if (method === "email" && !contact.email) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email is required for email verification.");
    }
    if (method === "sms" && !contact.phone) {
      return sendError(res, 400, "VALIDATION_ERROR", "Phone number is required for SMS verification.");
    }

    const result = await consumeOtpChallenge({
      purpose: "register",
      method,
      ...contact,
      otp,
    });

    if (!result.ok) {
      return sendError(res, result.status, result.code, result.message);
    }

    const { challenge } = result;
    const pending = challenge.pendingData;
    if (!pending?.email || !pending?.passwordHash || !pending?.name) {
      debugOtp("Register verify failed: pending data missing", {
        challengeId: challenge._id.toString(),
      });
      await OtpChallenge.deleteOne({ _id: challenge._id });
      return sendError(res, 400, "OTP_NOT_FOUND", "Verification code not found.");
    }

    const existingUser = await User.findOne({ email: pending.email });
    debugOtp("Register verify user lookup", {
      email: pending.email,
      found: Boolean(existingUser),
    });
    if (existingUser) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
      return sendError(res, 409, "ACCOUNT_EXISTS", "An account with this email already exists.");
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      phone: pending.phone ?? null,
      emailVerified: method === "email",
      verificationMethod: method,
    });
    debugOtp("Register verify user created", {
      userId: user._id.toString(),
      email: user.email,
    });

    await OtpChallenge.deleteOne({ _id: challenge._id });
    const accessToken = await issueAuthTokens(res, user);

    return res.status(201).json({
      message: "Registration verified successfully.",
      accessToken,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("registerVerify error:", error);
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      isProduction ? "Unable to verify registration." : error.message
    );
  }
};

// Login a user and issue tokens.
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email and password are required.");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    }
    if (user.verificationMethod === "email" && user.emailVerified === false) {
      return sendError(
        res,
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email before logging in."
      );
    }

    const storedPassword = user.password || user.password_hash;
    if (!storedPassword) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    }

    const passwordMatches = await bcrypt.compare(password, storedPassword);
    if (!passwordMatches) {
      return sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    }

    if (!user.password && user.password_hash) {
      user.password = user.password_hash;
      user.password_hash = null;
    }

    const accessToken = await issueAuthTokens(res, user);

    return res.json({
      message: "Login successful.",
      accessToken,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to login.");
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { method, email, phone } = req.body;
    const contact = getContactFromBody({ method, email, phone });

    if (method === "email" && !contact.email) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email is required for email verification.");
    }
    if (method === "sms" && !contact.phone) {
      return sendError(res, 400, "VALIDATION_ERROR", "Phone number is required for SMS verification.");
    }

    if (method === "email" && !hasSmtpConfig()) {
      return sendError(
        res,
        503,
        "EMAIL_NOT_CONFIGURED",
        "Email verification is not configured on the server."
      );
    }

    const userQuery = method === "email" ? { email: contact.email } : { phone: contact.phone };
    const user = await User.findOne(userQuery);

    if (!user) {
      return sendError(res, 404, "ACCOUNT_NOT_FOUND", "No account matches the provided details.");
    }

    await createOrReplaceOtpChallenge({
      purpose: "password_reset",
      method,
      ...contact,
      pendingData: { userId: user._id.toString() },
    });

    return res.json(buildSecureOtpResponse("Verification code sent successfully"));
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to process password reset.");
  }
};

const verifyPasswordReset = async (req, res) => {
  try {
    const { method, email, phone, otp, newPassword } = req.body;
    const contact = getContactFromBody({ method, email, phone });

    if (!isStrongPassword(newPassword)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Password does not meet complexity requirements.");
    }
    if (method === "email" && !contact.email) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email is required for email verification.");
    }
    if (method === "sms" && !contact.phone) {
      return sendError(res, 400, "VALIDATION_ERROR", "Phone number is required for SMS verification.");
    }

    const result = await consumeOtpChallenge({
      purpose: "password_reset",
      method,
      ...contact,
      otp,
    });
    if (!result.ok) {
      return sendError(res, result.status, result.code, result.message);
    }

    const { challenge } = result;
    const userQuery =
      method === "email" ? { email: contact.email } : { phone: contact.phone };
    const user = await User.findOne(userQuery);

    if (user) {
      user.password = await bcrypt.hash(newPassword, 12);
      user.password_hash = null;
      await user.save();
    }

    await OtpChallenge.deleteOne({ _id: challenge._id });

    return res.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("verifyPasswordReset error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to verify password reset.");
  }
};

// Refresh access token and rotate refresh token.
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return sendError(res, 401, "UNAUTHORIZED", "Refresh token missing.");
    }

    const hashedToken = hashRefreshToken(token);
    const user = await User.findOne({ refreshToken: hashedToken });
    if (!user) {
      clearRefreshCookie(res);
      return sendError(res, 401, "UNAUTHORIZED", "Refresh token invalid or reused.");
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken();
    user.refreshToken = hashRefreshToken(newRefreshToken);
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      message: "Token refreshed.",
      accessToken,
      token: accessToken,
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to refresh token.");
  }
};

// Clear refresh token and cookie.
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hashedToken = hashRefreshToken(token);
      await User.updateOne(
        { refreshToken: hashedToken },
        { $set: { refreshToken: null } }
      );
    }

    clearRefreshCookie(res);
    return res.json({ message: "Logged out." });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to logout.");
  }
};

// Return current user info (requires access token).
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role created_at"
    );
    if (!user) {
      return sendError(res, 404, "NOT_FOUND", "User not found.");
    }

    return res.json({ user });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to fetch user.");
  }
};

export {
  register,
  registerInitiate,
  registerVerify,
  login,
  requestPasswordReset,
  verifyPasswordReset,
  refresh,
  logout,
  me,
};
