import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
    { default: securityLogger },
    authMiddlewareModule,
    ollamaConfigModule,
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
    import("./middleware/securityLogger.js"),
    import("./middleware/authMiddleware.js"),
    import("./config/ollama.js"),
    import("./routes/adminRoutes.js"),
    import("./middleware/notFound.js"),
    import("./middleware/errorHandler.js"),
  ]);

  const requireAuth = authMiddlewareModule.default;
  const { requireRole } = authMiddlewareModule;
  const { checkOllamaAvailability } = ollamaConfigModule;

  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(securityLogger);
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.get("/", (req, res) => {
    res.send("StudyPal backend is running");
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

  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const ollamaStatus = await checkOllamaAvailability();
  if (ollamaStatus.ok) {
    console.log(ollamaStatus.message);
  } else {
    console.warn(`[OLLAMA_WARNING] ${ollamaStatus.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Server bootstrap error:", error);
});
