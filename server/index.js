const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { logger, sanitizeObject } = require("./logger");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());

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

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { email, password, role, rememberMe = false } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({
      message: "email, password, and role are required"
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const normalizedRole = String(role).toLowerCase();
  if (normalizedRole !== "employee" && normalizedRole !== "employer") {
    return res.status(400).json({
      message: "role must be either employee or employer"
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      role: normalizedRole
    }
  });

  if (!user) {
    logger.warn("login_failed_user_not_found", {
      requestId: req.requestId,
      email: normalizedEmail,
      role: normalizedRole
    });

    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn("login_failed_invalid_password", {
      requestId: req.requestId,
      email: normalizedEmail,
      role: normalizedRole,
      userId: user.id
    });

    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  logger.info("login_success", {
    requestId: req.requestId,
    userId: user.id,
    email: user.email,
    role: user.role,
    rememberMe: Boolean(rememberMe)
  });

  return res.status(200).json({
    message: "Login successful",
    token: `demo-token-${user.id}`,
    session: {
      rememberMe: Boolean(rememberMe),
      expiresIn: Boolean(rememberMe) ? "30d" : "session"
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    }
  });
});

app.use((err, _req, res, _next) => {
  logger.error("unhandled_error", {
    requestId: _req?.requestId,
    message: err.message,
    stack: err.stack
  });

  res.status(500).json({ message: "Internal server error" });
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    clientOrigin: CLIENT_ORIGIN
  });
});
