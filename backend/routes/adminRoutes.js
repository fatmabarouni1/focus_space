import express from "express";
import { getPaginationStats, listIndexes, listLogs, listUsers, updateUserRole } from "../controllers/adminController.js";
import paginateMiddleware from "../middleware/paginateMiddleware.js";
import validate from "../middleware/validate.js";
import { adminSchemas } from "../validators/index.js";

const router = express.Router();

router.get(
  "/users",
  validate({ query: adminSchemas.listUsersQuery }),
  paginateMiddleware("offset"),
  listUsers
);
router.get("/indexes", listIndexes);
router.get("/logs", listLogs);
router.get("/pagination-stats", getPaginationStats);
router.patch(
  "/users/:id/role",
  validate({
    params: adminSchemas.updateRoleParams,
    body: adminSchemas.updateRoleBody,
  }),
  updateUserRole
);

export default router;
