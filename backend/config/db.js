import mongoose from "mongoose";
import config from "./index.js";

const connectDatabase = async () => {
  if (!config.db.uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(config.db.uri);
  return mongoose.connection;
};

const getDatabaseHealth = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};

export { connectDatabase, getDatabaseHealth };
