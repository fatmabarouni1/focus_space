import morgan from "morgan";
import { randomUUID } from "crypto";
import logger from "../utils/logger.js";
import config from "../config/index.js";

morgan.token("request-id", (req) => req.requestId);
morgan.token("ip", (req) => req.ip);

const requestIdMiddleware = (req, _res, next) => {
  req.requestId = randomUUID();
  next();
};

const format =
  config.env === "production"
    ? ':request-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
    : ":request-id :method :url :status :response-time ms - :ip";

const morganMiddleware = morgan(format, {
  skip: (req) => req.method === "GET" && req.path === "/health",
  stream: {
    write: (message) => {
      logger.http(message.trim());
    },
  },
});

const httpLogger = [requestIdMiddleware, morganMiddleware];

export default httpLogger;
