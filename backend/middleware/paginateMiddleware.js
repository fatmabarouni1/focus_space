import { MAX_LIMIT } from "../utils/paginate.js";

/**
 * @typedef {Object} PaginationParams
 * @property {"cursor"|"offset"} mode
 * @property {number} limit
 * @property {string|null} cursor
 * @property {number} page
 */

const parsePositiveInteger = (value) => {
  if (value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 1) return null;
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const paginateMiddleware = (mode = "cursor") => (req, res, next) => {
  const rawLimit = req.query.limit;
  const rawPage = req.query.page;
  const rawCursor = req.query.cursor;

  const parsedLimit =
    rawLimit === undefined ? 20 : parsePositiveInteger(rawLimit);
  const parsedPage = rawPage === undefined ? 1 : parsePositiveInteger(rawPage);

  if (parsedLimit === null || parsedPage === null) {
    return res.status(400).json({ error: "Invalid pagination params" });
  }

  if (
    rawCursor !== undefined &&
    (typeof rawCursor !== "string" || rawCursor.trim().length === 0)
  ) {
    return res.status(400).json({ error: "Invalid pagination params" });
  }

  /** @type {PaginationParams} */
  req.pagination = {
    mode,
    limit: Math.min(parsedLimit, MAX_LIMIT),
    cursor: typeof rawCursor === "string" ? rawCursor.trim() : null,
    page: parsedPage,
  };

  return next();
};

export default paginateMiddleware;
