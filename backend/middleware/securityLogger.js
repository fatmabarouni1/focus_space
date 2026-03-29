import logger from "../utils/logger.js";

const securityLogger = (req, res, next) => {
  logger.info("Security request log", {
    ip: req.ip,
    action: `${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
  next();
};

export default securityLogger;
