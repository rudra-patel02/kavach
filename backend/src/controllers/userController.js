import bcrypt from "bcryptjs";

import User from "../models/user.js";
import { getPermissionsForRole } from "../security/rbac.js";
import { createAuditLog } from "../services/auditService.js";

// The only assignable roles in v1. Roles are server-owned; anything else falls
// back to the least-privileged role.
const USER_MANAGEMENT_ROLES = ["Manager", "Engineer", "Viewer"];

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const toSafeUser = (user) => {
  const value = user && typeof user.toObject === "function" ? user.toObject() : user;

  if (!value) {
    return null;
  }

  const { password, refreshToken, ...safeUser } = value;
  return {
    ...safeUser,
    id: String(value._id || value.id),
    permissions:
      Array.isArray(value.permissions) && value.permissions.length > 0
        ? value.permissions
        : getPermissionsForRole(value.role),
  };
};

const normalizeUserRole = (role) =>
  USER_MANAGEMENT_ROLES.includes(role) ? role : "Viewer";

export const getUsers = async (req, res) => {
  try {
    const query = {};

    if (req.query.search) {
      const search = String(req.query.search).trim();
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { role: new RegExp(search, "i") },
        { department: new RegExp(search, "i") },
      ];
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      roles: USER_MANAGEMENT_ROLES,
      users: users.map(toSafeUser),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(String(req.body.email || ""));
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = normalizeUserRole(req.body.role);
    // An admin sets the role explicitly here; permissions / tenant / plant are
    // never accepted from the request body (CLAUDE.md hard rule).
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department: req.body.department || "Production",
      phone: req.body.phone || "",
      status: req.body.status || "Active",
    });
    const safeUser = toSafeUser(user);

    await createAuditLog({
      action: "USER_CREATED",
      newValue: safeUser,
      req,
      resourceId: user._id,
      resourceType: "user",
    });

    res.status(201).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, message: "User id is required" });
    }

    const user = await User.findById(req.params.id).select("+password +refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const oldValue = toSafeUser(user);
    const assignableFields = ["department", "name", "phone", "status"];

    for (const field of assignableFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    if (req.body.email !== undefined) {
      const email = normalizeEmail(String(req.body.email || ""));

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
      }

      user.email = email;
    }

    if (req.body.role !== undefined) {
      user.role = normalizeUserRole(req.body.role);
    }

    if (req.body.password) {
      const password = String(req.body.password);

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }

      user.password = await bcrypt.hash(password, 10);
      user.refreshToken = "";
    }

    await user.save();

    const safeUser = toSafeUser(user);

    await createAuditLog({
      action:
        oldValue.role !== safeUser.role
          ? "USER_ROLE_CHANGED"
          : "USER_UPDATED",
      newValue: safeUser,
      oldValue,
      req,
      resourceId: user._id,
      resourceType: "user",
    });

    res.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User email or employee id already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const oldValue = toSafeUser(user);
    await user.deleteOne();

    await createAuditLog({
      action: "USER_DELETED",
      oldValue,
      req,
      resourceId: req.params.id,
      resourceType: "user",
    });

    res.json({
      deletedId: req.params.id,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
