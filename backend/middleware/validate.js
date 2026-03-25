import { ApiError } from "../utils/errors.js";

const formatZodErrors = (error) =>
  error.errors.map((err) => ({
    path: err.path.join(".") || "root",
    message: err.message,
  }));

const validate =
  ({ body, params, query } = {}) =>
  (req, res, next) => {
    const details = [];

    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        details.push(...formatZodErrors(result.error));
      } else {
        req.body = result.data;
      }
    }

    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) {
        details.push(...formatZodErrors(result.error));
      } else {
        req.params = result.data;
      }
    }

    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        details.push(...formatZodErrors(result.error));
      } else {
        req.query = result.data;
      }
    }

    if (details.length > 0) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "Invalid request.", details)
      );
    }

    return next();
  };

export default validate;
