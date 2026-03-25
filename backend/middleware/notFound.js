import { buildErrorResponse } from "../utils/errors.js";

const notFound = (req, res) =>
  res
    .status(404)
    .json(buildErrorResponse("NOT_FOUND", "Route not found.", []));

export default notFound;
