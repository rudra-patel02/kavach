import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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

  await mongoose.connect(mongoUri, {
    maxPoolSize: Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? maxPoolSize : 10,
    serverSelectionTimeoutMS: parsePositiveInteger(
      process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
      10000
    ),
  });

  console.log("MongoDB connected");
  return mongoose.connection;
};

export const connectDBWithRetry = async ({
  attempts = parsePositiveInteger(process.env.MONGO_CONNECT_ATTEMPTS, 5),
  delayMs = parsePositiveInteger(process.env.MONGO_CONNECT_RETRY_MS, 5000),
} = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await connectDB();
    } catch (error) {
      lastError = error;
      console.error(
        `MongoDB connection attempt ${attempt}/${attempts} failed: ${error.message}`
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
