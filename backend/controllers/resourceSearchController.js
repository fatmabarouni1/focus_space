import RevisionModule from "../models/RevisionModule.js";
import { searchSerperOrganicResults } from "../services/resourceSearchService.js";
import { sendError } from "../utils/errors.js";

const searchModuleResources = async (req, res) => {
  try {
    const module = await RevisionModule.findOne({
      _id: req.params.moduleId,
      user_id: req.user.id,
    });

    if (!module) {
      return sendError(res, 404, "NOT_FOUND", "Module not found.");
    }

    const query = String(req.body?.query ?? "").trim();
    if (!query) {
      return sendError(res, 400, "VALIDATION_ERROR", "Search query is required.");
    }

    const results = await searchSerperOrganicResults(query);

    return res.json({
      query,
      results,
    });
  } catch (error) {
    return sendError(
      res,
      500,
      "RESOURCE_SEARCH_FAILED",
      error.message || "Failed to search resources."
    );
  }
};

export { searchModuleResources };
