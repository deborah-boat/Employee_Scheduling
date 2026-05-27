const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { logger, sanitizeObject } = require("./logger");

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// ─── App factory ─────────────────────────────────────────────────────────────
// Accepts a prisma instance and an optional deps object so tests can inject
// mocks without needing vi.mock (which causes CJS/ESM scope conflicts).

function createApp(prisma, deps = {}) {
  const bcrypt = deps.bcrypt || require("bcrypt");
  const requiresAuth = deps.requiresAuth || require("express-openid-connect").requiresAuth;
  const app = express();

  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  if (deps.authMiddleware) {
    app.use(deps.authMiddleware);
  }

  app.use((req, res, next) => {
    req.requestId = req.get("x-request-id") || randomUUID();
    res.setHeader("x-request-id", req.requestId);

    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const elapsedNs = process.hrtime.bigint() - startedAt;
      const durationMs = Number(elapsedNs) / 1_000_000;

      logger.info("http_request", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        ip: req.ip,
        userAgent: req.get("user-agent") || "",
        body: sanitizeObject(req.body || {})
      });
    });

    next();
  });

  // ─── Routes ────────────────────────────────────────────────────────────────
  app.use(require("./routes/auth")(prisma, { bcrypt }));
  app.use(require("./routes/employees")(prisma, { requiresAuth }));
  app.use(require("./routes/availability")(prisma, { requiresAuth }));
  app.use(require("./routes/schedule")(prisma, { requiresAuth }));

  // Global error handler
  app.use((err, _req, res, _next) => {
    logger.error("unhandled_error", { message: err.message, stack: err.stack });
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

// ─── Production Prisma instance ─────────────────────────────────────────────
// Exported so index.js can pass it into createApp() and attach lifecycle hooks.

const prisma = new PrismaClient();

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = { prisma, createApp };
