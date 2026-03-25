// Basic security logging: IP, action, timestamp.
const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const action = `${req.method} ${req.originalUrl}`;
  const ip = req.ip;

  console.log(`[SECURITY] ${timestamp} | ${ip} | ${action}`);
  next();
};

export default securityLogger;
