import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Strong test secrets (>= 32 chars) so the production boot guard is satisfied.
// Rate/brute-force limits are raised out of the way so a test file's request
// volume (many logins/API calls against one shared app) never trips a 429 —
// rate limiting is exercised by its own integration checks, not incidentally.
export const TEST_ENV = {
  JWT_SECRET: "test-secret-at-least-32-characters-long-abc",
  JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-characters-xyz",
  RATE_LIMIT_MAX: "1000000",
  AUTH_RATE_LIMIT_MAX: "1000000",
  BRUTE_FORCE_MAX_FAILURES: "1000000",
};

let mongod;

export const startTestDb = async () => {
  Object.assign(process.env, TEST_ENV);
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "test";
  }
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const stopTestDb = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

export const resetDb = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};
