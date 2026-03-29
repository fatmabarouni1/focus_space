import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import packageJson from "./package.json" with { type: "json" };
import config from "./config/index.js";
import { connectDatabase, getDatabaseHealth } from "./config/db.js";
import { llm } from "./services/llm.js";
import logger from "./utils/logger.js";
import httpLogger from "./middleware/httpLogger.js";
import mongoose from "mongoose";

const app = express();
const PORT = config.port;
const clientOrigins = config.app.clientOrigins;
const uploadsPath = fileURLToPath(new URL("./uploads", import.meta.url));
const maskMongoUri = (value) => {
  if (!value) return "";
  return value.replace(/(mongodb(?:\+srv)?:\/\/)([^@/]+)@/i, "$1***:***@");
};

const bootstrap = async () => {
  const [
    { default: authRoutes },
    { default: studySessionRoutes },
    { default: timerRoutes },
    { default: noteRoutes },
    { default: musicPreferenceRoutes },
    { default: courseSuggestionRoutes },
    { default: goalRoutes },
    { default: eventRoutes },
    { default: dashboardRoutes },
    { default: revisionRoutes },
    { default: suggestionsRoutes },
    { default: roomRoutes },
    { default: moduleAiRoutes },
    { default: studyCompanionRoutes },
    authMiddlewareModule,
    { default: adminRoutes },
    { default: notFound },
    { default: errorHandler },
  ] = await Promise.all([
    import("./routes/authRoutes.js"),
    import("./routes/studySessionRoutes.js"),
    import("./routes/timerRoutes.js"),
    import("./routes/noteRoutes.js"),
    import("./routes/musicPreferenceRoutes.js"),
    import("./routes/courseSuggestion.routes.js"),
    import("./routes/goalRoutes.js"),
    import("./routes/eventRoutes.js"),
    import("./routes/dashboardRoutes.js"),
    import("./routes/revisionRoutes.js"),
    import("./routes/suggestionsRoutes.js"),
    import("./routes/roomRoutes.js"),
    import("./routes/moduleAiRoutes.js"),
    import("./routes/studyCompanionRoutes.js"),
    import("./middleware/authMiddleware.js"),
    import("./routes/adminRoutes.js"),
    import("./middleware/notFound.js"),
    import("./middleware/errorHandler.js"),
  ]);

  const requireAuth = authMiddlewareModule.default;
  const { requireRole } = authMiddlewareModule;

  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(httpLogger);
  app.use("/uploads", express.static(uploadsPath));

  app.get("/", (req, res) => {
    res.send("StudyPal backend is running");
  });

  app.get("/health", async (req, res) => {
    const llmStatus = await llm.isAvailable();
    res.json({
      status: "ok",
      env: config.env,
      version: packageJson.version,
      services: {
        database: getDatabaseHealth(),
        llm: llmStatus.ok ? "ok" : "unavailable",
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth/")) {
      return next();
    }
    return requireAuth(req, res, next);
  });
  app.use("/api/admin", requireRole("admin"), adminRoutes);
  app.use("/api/sessions", studySessionRoutes);
  app.use("/api/timers", timerRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/goals", goalRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/music", musicPreferenceRoutes);
  app.use("/api/revision", revisionRoutes);
  app.use("/api/suggestions", suggestionsRoutes);
  app.use("/api", courseSuggestionRoutes);
  app.use("/api", moduleAiRoutes);
  app.use("/api/study-companion", studyCompanionRoutes);
  app.use("/api/rooms", roomRoutes);

  app.use(notFound);
  app.use(errorHandler);

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected", {
      event: "mongodb_connected",
      requestId: null,
    });
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected", {
      event: "mongodb_disconnected",
      requestId: null,
    });
  });
  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", {
      event: "mongodb_error",
      error: error?.message,
      stack: error?.stack,
      requestId: null,
    });
  });

  await connectDatabase();

  const llmStatus = await llm.isAvailable();
  if (llmStatus.ok) {
    logger.info("LLM ready", {
      provider: llmStatus.provider,
      model: llmStatus.model,
    });
  } else {
    logger.warn("LLM unavailable", {
      provider: llmStatus.provider,
      model: llmStatus.model,
    });
  }

  app.listen(PORT, () => {
    logger.info("Server started", {
      env: config.env,
      port: PORT,
      llmProvider: config.llm.provider,
      mongoUri: maskMongoUri(config.db.uri),
    });
  });
};

bootstrap().catch((error) => {
  logger.error("Server bootstrap error", {
    error: error?.message,
    stack: error?.stack,
  });
});
