import bcrypt from "bcryptjs";

import User from "../models/user.js";

const toSafeUser = (user) => {
  const value = user && typeof user.toObject === "function" ? user.toObject() : user;
  delete value.password;
  delete value.refreshToken;
  return value;
};

const getCompanyProfile = () => ({
  name: process.env.COMPANY_NAME || "KAVACH Industrial Operations",
  site: process.env.COMPANY_SITE || "Primary Plant",
  industry: process.env.COMPANY_INDUSTRY || "Industrial Manufacturing",
  timezone: process.env.COMPANY_TIMEZONE || "Asia/Calcutta",
});

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      profile: toSafeUser(user),
      company: getCompanyProfile(),
      preferences: {
        theme: user.themePreference || "dark",
        notifications: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error("Failed to load settings:", error);
    res.status(500).json({
      message: "Failed to load settings",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = {};

    for (const field of ["name", "department", "phone"]) {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field] || "").trim();
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      profile: toSafeUser(user),
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const nextPassword = String(req.body?.nextPassword || "");

    if (!currentPassword || !nextPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (nextPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(nextPassword, 10);
    user.refreshToken = "";
    await user.save();

    res.json({
      success: true,
      message: "Password updated. Please sign in again.",
    });
  } catch (error) {
    console.error("Failed to update password:", error);
    res.status(500).json({
      message: "Failed to update password",
    });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const updates = {};

    if (req.body.theme) {
      updates.themePreference = req.body.theme === "system" ? "system" : "dark";
    }

    if (req.body.notifications && typeof req.body.notifications === "object") {
      updates.notificationPreferences = {
        email: Boolean(req.body.notifications.email),
        criticalAlerts: Boolean(req.body.notifications.criticalAlerts),
        weeklyReports: Boolean(req.body.notifications.weeklyReports),
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      preferences: {
        theme: user.themePreference,
        notifications: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    res.status(500).json({
      message: "Failed to update preferences",
    });
  }
};
