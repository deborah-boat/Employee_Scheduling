const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { logger, sanitizeObject } = require("./logger");
const { z, ZodError } = require("zod");

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

function normalizeRole(value) {
  const role = String(value || "").toLowerCase();
  return role === "employer" || role === "employee" ? role : "employee";
}

function getLogoutReturnTo() {
  return process.env.AUTH0_POST_LOGOUT_REDIRECT || CLIENT_ORIGIN;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

const availabilitySchema = z.object({
  date: z.string(),
  shift_id: z.coerce.number().int(),
  status: z.string()
});

const scheduleSchema = z.object({
  employeeId: z.coerce.number().int(),
  date: z.string(),
  shift_id: z.coerce.number().int()
});

// ─── App factory ─────────────────────────────────────────────────────────────
// Accepts a prisma instance and an optional deps object so tests can inject
// mocks without needing vi.mock (which causes CJS/ESM scope conflicts).

function createApp(prisma, deps = {}) {
  const bcrypt = deps.bcrypt || require("bcrypt");
  const app = express();

  app.use(cors({ origin: CLIENT_ORIGIN }));
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

  // Health check — used to verify the server is reachable
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api/auth/login", (req, res) => {
    const role = normalizeRole(req.query.role);
    const returnTo = `${CLIENT_ORIGIN}/?role=${encodeURIComponent(role)}`;

    return res.oidc.login({ returnTo });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const role = normalizeRole(req.query.role);

    const oidcUser = req.oidc.user || {};
    return res.status(200).json({
      user: {
        id: oidcUser.sub,
        email: oidcUser.email || "",
        role,
        displayName: oidcUser.name || oidcUser.nickname || oidcUser.email || "User"
      }
    });
  });

  app.get("/api/auth/logout", (_req, res) => {
    return res.oidc.logout({ returnTo: getLogoutReturnTo() });
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      if (req.oidc && typeof req.oidc.isAuthenticated === "function" && req.oidc.isAuthenticated()) {
        return res.oidc.logout({ returnTo: getLogoutReturnTo() });
      }
    } catch (err) {
      // ignore and continue to return a JSON response for API clients
    }

    return res.status(200).json({ message: "Logged out" });
  });

  // Login — validates credentials and returns user info
  app.post("/api/login", async (req, res) => {
    const { email, password, role, rememberMe = false } = req.body || {};

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password, and role are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = String(role).toLowerCase();

    if (normalizedRole !== "employee" && normalizedRole !== "employer") {
      return res.status(400).json({ message: "role must be either employee or employer" });
    }

    try {
      const user = await prisma.user.findFirst({
        where: { email: normalizedEmail, role: normalizedRole }
      });

      if (!user) {
        logger.warn("login_failed_user_not_found", { requestId: req.requestId, email: normalizedEmail });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn("login_failed_invalid_password", { requestId: req.requestId, userId: user.id });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      logger.info("login_success", { requestId: req.requestId, userId: user.id });

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
    } catch (err) {
      logger.error("login_error", { requestId: req.requestId, error: err.message });
      return res.status(500).json({ message: "Internal server error. Please try again." });
    }
  });

  // GET /employees – list all employees (optionally filtered by name)
  app.get("/employees", async (req, res) => {
    try {
      const { name } = req.query;
      const employees = await prisma.employee.findMany({
        where: { name: name ? { contains: String(name), mode: "insensitive" } : undefined },
        include: {
          shifts: { include: { shiftInstance: { include: { shift: true } } } }
        }
      });
      res.json(employees);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // POST /employees – register new employee (employer only)
  app.post("/employees", async (req, res) => {
    try {
      const role = req.headers["x-role"];
      if (role !== "employer") {
        res.status(403).send("Forbidden: employer access only");
        return;
      }

      const { name, email } = employeeSchema.parse(req.body);
      const employee = await prisma.employee.create({ data: { name, email } });
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // GET /employee – get first employee record
  app.get("/employee", async (_req, res) => {
    try {
      const employee = await prisma.employee.findFirst();
      res.json(employee);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // DELETE /employees/:id – employer only
  app.delete("/employees/:id", async (req, res) => {
    try {
      const role = req.headers["x-role"];
      if (role !== "employer") {
        res.status(403).send("Forbidden: employer access only");
        return;
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).send("Invalid employee id");
        return;
      }
      await prisma.employee.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // GET /availability/:id – get employee availability
  app.get("/availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).send("Invalid employee id");
        return;
      }
      const availability = await prisma.availability.findMany({
        where: { employeeId: id },
        include: { shift: true }
      });
      res.json(availability);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // PUT /availability/:id – employee sets own availability
  app.put("/availability/:id", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        res.status(400).send("Invalid employee id");
        return;
      }

      const { date, shift_id, status } = availabilitySchema.parse(req.body);

      const existing = await prisma.availability.findFirst({
        where: { employeeId, shift_id, date: new Date(date) }
      });

      const result = existing
        ? await prisma.availability.update({ where: { id: existing.id }, data: { status } })
        : await prisma.availability.create({ data: { employeeId, shift_id, date: new Date(date), status } });

      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) { return res.status(400).json(error.flatten()); }
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // GET /schedule – view full job schedule
  app.get("/schedule", async (_req, res) => {
    try {
      const schedule = await prisma.shiftInstances.findMany({
        include: { shift: true, employees: { include: { employee: true } } }
      });
      res.json(schedule);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // PUT /schedule – employer assigns employee to a shift
  app.put("/schedule", async (req, res) => {
    try {
      const role = req.headers["x-role"];
      if (role !== "employer") {
        res.status(403).send("Forbidden: employer access only");
        return;
      }

      const { employeeId, date, shift_id } = scheduleSchema.parse(req.body);

      let shiftInstance = await prisma.shiftInstances.findFirst({
        where: { shift_id, date: new Date(date) }
      });
      if (!shiftInstance) {
        shiftInstance = await prisma.shiftInstances.create({
          data: { shift_id, date: new Date(date) }
        });
      }

      const existing = await prisma.employeeShift.findFirst({
        where: { employeeId, shiftInstanceId: shiftInstance.id }
      });
      if (!existing) {
        await prisma.employeeShift.create({
          data: { employeeId, shiftInstanceId: shiftInstance.id }
        });
      }

      res.status(200).json({ employeeId, shiftInstanceId: shiftInstance.id });
    } catch (error) {
      if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // DELETE /schedule – employer removes employee from a shift
  app.delete("/schedule", async (req, res) => {
    try {
      const role = req.headers["x-role"];
      if (role !== "employer") {
        res.status(403).send("Forbidden: employer access only");
        return;
      }

      const { employeeId, date, shift_id } = scheduleSchema.parse(req.body);

      const shiftInstance = await prisma.shiftInstances.findFirst({
        where: { shift_id, date: new Date(date) }
      });
      if (!shiftInstance) {
        return res.status(204).send();
      }

      await prisma.employeeShift.deleteMany({
        where: { employeeId, shiftInstanceId: shiftInstance.id }
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

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
