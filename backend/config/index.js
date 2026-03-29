import dotenvSafe from "dotenv-safe";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const env = (process.env.NODE_ENV || "development").trim() || "development";
const envPath = path.join(backendRoot, `.env.${env}`);
const examplePath = path.join(backendRoot, ".env.example");

dotenvSafe.config({
  path: envPath,
  example: examplePath,
  allowEmptyValues: false,
});

const requireMinLength = (value, label, minLength) => {
  if (!value || value.length < minLength) {
    throw new Error(`${label} must be at least ${minLength} characters long.`);
  }
};

const llmProvider = String(process.env.LLM_PROVIDER || "")
  .trim()
  .toLowerCase();

if (!["ollama", "groq"].includes(llmProvider)) {
  throw new Error('LLM_PROVIDER must be either "ollama" or "groq".');
}

requireMinLength(process.env.JWT_SECRET || "", "JWT_SECRET", 32);
requireMinLength(process.env.JWT_REFRESH_SECRET || "", "JWT_REFRESH_SECRET", 32);

if (llmProvider === "groq" && !String(process.env.GROQ_API_KEY || "").trim()) {
  throw new Error("GROQ_API_KEY is required when LLM_PROVIDER=groq.");
}

const config = {
  env,
  port: Number(process.env.PORT || 5000),
  app: {
    clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  db: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
    cookieSameSite: process.env.COOKIE_SAME_SITE || (env === "production" ? "none" : "lax"),
  },
  llm: {
    provider: llmProvider,
    groqKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    ollamaUrl: (process.env.OLLAMA_URL || "").replace(/\/$/, ""),
    ollamaModel: process.env.OLLAMA_MODEL || "qwen2.5:1.5b",
    embeddingModel:
      process.env.EMBEDDING_MODEL || "Xenova/nomic-embed-text-v1",
  },
  search: {
    serperApiKey: process.env.SERPER_API_KEY || "",
  },
  mail: {
    host: process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || "",
    port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587),
    secure:
      String(process.env.BREVO_SMTP_SECURE || process.env.SMTP_SECURE || "false") ===
      "true",
    user: process.env.BREVO_SMTP_USER || process.env.SMTP_USER || "",
    pass: process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || "",
    from: process.env.BREVO_SMTP_FROM || process.env.SMTP_FROM || "",
  },
};

if (config.llm.provider === "ollama" && !config.llm.ollamaUrl) {
  throw new Error("OLLAMA_URL is required when LLM_PROVIDER=ollama.");
}

export default config;
