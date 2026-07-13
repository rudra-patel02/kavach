import bcrypt from "bcryptjs";

import User from "../models/user.js";

export const ADMIN_EMAIL = "admin@kavach.com";
export const ADMIN_PASSWORD = "admin123";

export const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export const ensureSeededAdminUser = async ({
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
} = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken"
  );
  const hadUser = Boolean(existingUser);
  const hadBcryptPassword = isBcryptHash(existingUser?.password);
  const passwordMatched =
    hadBcryptPassword && (await bcrypt.compare(password, existingUser.password));
  const hashedPassword = await bcrypt.hash(password, 10);
  const adminPayload = {
    activePlantId: existingUser?.activePlantId || "",
    department: existingUser?.department || "Administration",
    email: normalizedEmail,
    name: existingUser?.name || "KAVACH Admin",
    organizationId: existingUser?.organizationId || "",
    password: hashedPassword,
    permissions: existingUser?.permissions || [],
    phone: existingUser?.phone || "",
    plantIds: existingUser?.plantIds || [],
    refreshToken: "",
    role: "Super Admin",
    status: "Active",
    tenantId: existingUser?.tenantId || "",
  };

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: adminPayload,
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      new: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    }
  ).select("+password");

  return {
    email: normalizedEmail,
    hadBcryptPassword,
    hadUser,
    passwordMatched,
    passwordUpdated: !passwordMatched,
    storedPasswordIsBcrypt: isBcryptHash(user.password),
    userId: String(user._id),
  };
};
