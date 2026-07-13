import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./config/db.js";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ensureSeededAdminUser,
} from "./services/adminUserService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

try {
  await connectDB();

  const result = await ensureSeededAdminUser({
    email: process.env.SEED_ADMIN_EMAIL || ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD || ADMIN_PASSWORD,
  });

  console.log(
    JSON.stringify({
      level: "info",
      message: "seeded_admin_user_ready",
      ...result,
    })
  );
} catch (error) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "seeded_admin_user_failed",
      error: error.message,
    })
  );
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
