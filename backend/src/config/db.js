import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getMongoUriMetadata = (mongoUri = process.env.MONGO_URI) => {
  const value = String(mongoUri || "").trim();

  if (!value) {
    return {
      configured: false,
      database: "",
      hosts: [],
      protocol: "",
    };
  }

  try {
    const url = new URL(value);
    const hosts = url.host ? url.host.split(",").filter(Boolean) : [];
    const database = url.pathname.replace(/^\/+/, "").split("?")[0] || "";

    return {
      configured: true,
      database,
      hosts,
      protocol: url.protocol.replace(/:$/, ""),
    };
  } catch {
    return {
      configured: true,
      database: "",
      hosts: [],
      protocol: "unparseable",
    };
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE || 10);
  const metadata = getMongoUriMetadata(mongoUri);

  console.log(
    JSON.stringify({
      level: "info",
      message: "mongodb_connect_start",
      database: metadata.database,
      hosts: metadata.hosts,
      maxPoolSize:
        Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? maxPoolSize : 10,
      protocol: metadata.protocol,
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
    })
  );

  await mongoose.connect(mongoUri, {
    maxPoolSize: Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? maxPoolSize : 10,
    maxIdleTimeMS: parsePositiveInteger(
      process.env.MONGO_MAX_IDLE_TIME_MS,
      60000
    ),
    serverSelectionTimeoutMS: parsePositiveInteger(
      process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
      10000
    ),
  });

  console.log(
    JSON.stringify({
      level: "info",
      message: "mongodb_connected",
      database: mongoose.connection.name || metadata.database,
      host: mongoose.connection.host || metadata.hosts[0] || "",
      readyState: mongoose.connection.readyState,
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
    })
  );
  return mongoose.connection;
};

export const connectDBWithRetry = async ({
  attempts = parsePositiveInteger(process.env.MONGO_CONNECT_ATTEMPTS, 5),
  delayMs = parsePositiveInteger(process.env.MONGO_CONNECT_RETRY_MS, 5000),
} = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      console.log(
        JSON.stringify({
          level: "info",
          message: "mongodb_connect_attempt",
          attempt,
          attempts,
          delayMs,
          service: "kavach-backend",
          timestamp: new Date().toISOString(),
        })
      );
      return await connectDB();
    } catch (error) {
      lastError = error;
      console.error(
        JSON.stringify({
          level: "error",
          message: "mongodb_connect_attempt_failed",
          attempt,
          attempts,
          delayMs: attempt < attempts ? delayMs : 0,
          error: error.message,
          service: "kavach-backend",
          timestamp: new Date().toISOString(),
        })
      );

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

export default connectDB;
