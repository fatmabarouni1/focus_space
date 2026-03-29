class AppError extends Error {
  constructor(message, statusCode = 500, details = [], code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ApiError extends AppError {
  constructor(status, code, message, details = []) {
    super(message, status, details, code);
    this.name = "ApiError";
    this.status = status;
  }
}

const buildErrorResponse = (message, stack) => {
  const response = {
    success: false,
    error: message,
  };

  if (stack) {
    response.stack = stack;
  }

  return response;
};

const sendError = (res, status, code, message, details = []) =>
  res.status(status).json({
    success: false,
    error: message,
    code,
    ...(details.length ? { details } : {}),
  });

export { AppError, ApiError, buildErrorResponse, sendError };
