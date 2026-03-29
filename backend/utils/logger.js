import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";
import config from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, "../logs");

await mkdir(logsDir, { recursive: true });

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "token",
  "refreshtoken",
  "tokenhash",
  "authorization",
]);

const sanitize = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        return [key, "[REDACTED]"];
      }
      return [key, sanitize(entryValue)];
    })
  );
};

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const safeMeta = sanitize(meta);
    const suffix =
      Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : "";
    return `${timestamp} [${level}] ${message}${suffix}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: config.env === "production" ? prodFormat : devFormat,
  }),
];

if (config.env === "production") {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: prodFormat,
    })
  );
}

const logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  defaultMeta: {
    service: "focus-space-backend",
    env: config.env,
  },
  format: config.env === "production" ? prodFormat : devFormat,
  transports,
});

export { sanitize, logsDir };
export default logger;
