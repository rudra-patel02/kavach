import mongoose from "mongoose";

mongoose.set("strictQuery", true);

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
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected");
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

export default connectDB;
