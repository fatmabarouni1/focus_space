import mongoose from "mongoose";
import { AppError, ApiError, buildErrorResponse } from "../utils/errors.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const isProduction = config.env === "production";

  let statusCode = err?.statusCode || err?.status || 500;
  let message = err?.message || "Internal server error";
  let isOperational = Boolean(err?.isOperational);

  if (err instanceof AppError || err instanceof ApiError) {
    statusCode = err.statusCode || err.status || 500;
    message = err.message;
    isOperational = true;
  } else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired.";
    isOperational = true;
  } else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
    isOperational = true;
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((item) => item?.message || "Invalid value.")
      .join(", ") || "Validation failed.";
    isOperational = true;
  } else if (err?.name === "CastError" && err?.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ${err?.path || "id"}: ${err?.value}`;
    isOperational = true;
  } else if (err?.code === 11000) {
    const fields = Object.keys(err?.keyValue || {});
    message = fields.length
      ? `${fields.join(", ")} already exists.`
      : "Duplicate value error.";
    statusCode = 409;
    isOperational = true;
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON payload.";
    isOperational = true;
  } else if (err instanceof mongoose.Error) {
    statusCode = 400;
    message = "Database error.";
    isOperational = true;
  }

  const logPayload = {
    requestId: req.requestId,
    path: req.originalUrl || req.path,
    method: req.method,
    statusCode,
    stack: err?.stack,
    error: err?.message || message,
  };

  if (statusCode >= 500) {
    logger.error("Unhandled server error", logPayload);
  } else {
    logger.warn("Handled request error", logPayload);
  }

  if (isProduction && !isOperational) {
    return res.status(500).json(buildErrorResponse("Internal server error"));
  }

  return res
    .status(statusCode)
    .json(
      buildErrorResponse(message, isProduction ? undefined : err?.stack)
    );
};

export default errorHandler;
