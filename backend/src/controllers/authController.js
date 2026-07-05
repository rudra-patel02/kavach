import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const toSafeUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.refreshToken;
  return safeUser;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return process.env.JWT_SECRET;
};

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || `${getJwtSecret()}:refresh`;

const createAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      tokenVersion: user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now(),
    },
    getRefreshSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    }
  );

// ====================== REGISTER ======================
export const register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(String(req.body.email || ""));
    const password = String(req.body.password || "");

    const role = req.body.role || "Viewer";
    const department = req.body.department || "Production";
    const employeeId = req.body.employeeId || "";
    const phone = req.body.phone || "";

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

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      employeeId,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// ====================== LOGIN ======================
export const login = async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body.email || ""));
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      refreshToken,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken || "").trim();

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(refreshToken, getRefreshSecret());
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const token = createAccessToken(user);
    const nextRefreshToken = createRefreshToken(user);
    user.refreshToken = nextRefreshToken;
    await user.save();

    res.json({
      success: true,
      token,
      refreshToken: nextRefreshToken,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken || "").trim();

    if (refreshToken) {
      await User.updateOne({ refreshToken }, { $set: { refreshToken: "" } });
    }

    res.json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
