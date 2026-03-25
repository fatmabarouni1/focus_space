class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildErrorResponse = (code, message, details = []) => {
  if (details && details.length > 0) {
    return { error: { code, message, details } };
  }
  return { error: { code, message } };
};

const sendError = (res, status, code, message, details = []) =>
  res.status(status).json(buildErrorResponse(code, message, details));

export { ApiError, buildErrorResponse, sendError };
