const winston = require("winston");

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "accessToken",
  "refreshToken"
]);

function sanitizeObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = sanitizeObject(entry);
  }

  return sanitized;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "employee-server" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

module.exports = {
  logger,
  sanitizeObject
};