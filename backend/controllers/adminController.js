import mongoose from "mongoose";
import User from "../models/User.js";
import { sendError } from "../utils/errors.js";

// GET /api/admin/users?page=&limit=&search=
const listUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = (req.query.search || "").toString().trim();

    const filter = search
      ? { email: { $regex: search, $options: "i" } }
      : {};

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("email role created_at"),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to list users.");
  }
};

// PATCH /api/admin/users/:id/role { role: "user" | "admin" }
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid user id.");
    }

    if (!["user", "admin"].includes(role)) {
      return sendError(res, 400, "VALIDATION_ERROR", "Role must be user or admin.");
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("email role created_at");

    if (!user) {
      return sendError(res, 404, "NOT_FOUND", "User not found.");
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to update role.");
  }
};

export { listUsers, updateUserRole };
