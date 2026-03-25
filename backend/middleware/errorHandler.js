import mongoose from "mongoose";
import { ApiError, buildErrorResponse } from "../utils/errors.js";

const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred.";
  let details = [];

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details || [];
  } else if (err?.name === "TokenExpiredError") {
    status = 401;
    code = "UNAUTHORIZED";
    message = "Token expired.";
  } else if (err?.name === "JsonWebTokenError") {
    status = 401;
    code = "UNAUTHORIZED";
    message = "Invalid token.";
  } else if (err?.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid data.";
    details = Object.values(err.errors || {}).map((item) => ({
      path: item?.path || "root",
      message: item?.message || "Invalid value.",
    }));
  } else if (err?.name === "CastError" && err?.kind === "ObjectId") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid id format.";
    details = [{ path: err?.path || "id", message: "Invalid ObjectId." }];
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid JSON payload.";
  } else if (err instanceof mongoose.Error) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Database validation failed.";
  }

  if (!isProduction) {
    console.error(err);
  }

  return res
    .status(status)
    .json(buildErrorResponse(code, message, details));
};

export default errorHandler;
