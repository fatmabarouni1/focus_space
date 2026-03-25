import express from "express";
import { listUsers, updateUserRole } from "../controllers/adminController.js";
import validate from "../middleware/validate.js";
import { adminSchemas } from "../validators/index.js";

const router = express.Router();

router.get(
  "/users",
  validate({ query: adminSchemas.listUsersQuery }),
  listUsers
);
router.patch(
  "/users/:id/role",
  validate({
    params: adminSchemas.updateRoleParams,
    body: adminSchemas.updateRoleBody,
  }),
  updateUserRole
);

export default router;
