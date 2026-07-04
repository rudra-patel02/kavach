import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Remove password before sending response
    const { password: _, ...safeUser } = user.toObject();

    res.status(201).json({
      message: "User Registered Successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login Request:", email);

    const user = await User.findOne({ email });

    console.log("User Found:", user);

    if (!user) {
      return res.status(400).json({
        message: "Invalid Credentials - User Not Found",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    console.log("Password Match:", valid);

    if (!valid) {
      return res.status(400).json({
        message: "Invalid Credentials - Wrong Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Remove password before sending response
    const { password: _, ...safeUser } = user.toObject();

    res.status(200).json({
      message: "Login Successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};