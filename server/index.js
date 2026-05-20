const dotenv = require("dotenv");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { logger, sanitizeObject } = require("./logger");
const {z, ZodError} = require ("zod");
const { authMiddleware } = require("./Auth/auth");

// Load environment variables from .env
dotenv.config();

const { createApp, prisma } = require("./app");
const { logger } = require("./logger");

const app = createApp(prisma);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const ALLOWED_LOCAL_ORIGIN_PATTERN =
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const ALLOWED_ORIGINS = new Set([
  CLIENT_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

// Initialize Prisma Client
const prisma = new PrismaClient();

// Read the database URL from environment
const databaseUrl = process.env.DATABASE_URL;
// Crash early if the database URL is missing
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin and non-browser clients (e.g. curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (ALLOWED_ORIGINS.has(origin) || ALLOWED_LOCAL_ORIGIN_PATTERN.test(origin)) {
      callback(null, true);
      return;
    }

    logger.warn("cors_blocked_origin", {
      origin
    });

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use(authMiddleware);

// Return a clear client error when request JSON is malformed.
app.use((err, _req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON in request body"
    });
  }

  next(err);
});

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

// Define Zod schemas for request validation
const employeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

// Define Zod schemas for availability and schedule
const availabilitySchema = z.object({
  date: z.string(),
  shift_id: z.coerce.number().int(),
  status: z.string()
})

// Define Zod schema for schedule assignment
const scheduleSchema = z.object({
  employeeId: z.coerce.number().int(),
  shiftInstanceId: z.coerce.number().int()
})

// Health check — used to verify the server is reachable
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Auth login — starts Auth0 redirect flow
app.get("/api/auth/login", (req, res) => {
  const requestedRole = String(req.query.role || "").toLowerCase();
  const role = requestedRole === "employer" || requestedRole === "employee"
    ? requestedRole
    : "employee";
  const returnTo = `${CLIENT_ORIGIN}/?role=${encodeURIComponent(role)}`;

  return res.oidc.login({
    returnTo
  });
});

// Auth session — returns current Auth0 session user for the SPA
app.get("/api/auth/session", (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const requestedRole = String(req.query.role || "").toLowerCase();
  const role = requestedRole === "employer" || requestedRole === "employee"
    ? requestedRole
    : "employee";

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

// Auth logout — clears local session and logs out from Auth0
app.get("/api/auth/logout", (req, res) => {
  const returnTo = process.env.AUTH0_POST_LOGOUT_REDIRECT || CLIENT_ORIGIN;
  return res.oidc.logout({ returnTo });
});

// API logout — supports SPA/demo sessions (POST) and falls back to OIDC logout
app.post("/api/auth/logout", (req, res) => {
  try {
    if (req.oidc && typeof req.oidc.isAuthenticated === "function" && req.oidc.isAuthenticated()) {
      const returnTo = process.env.AUTH0_POST_LOGOUT_REDIRECT || CLIENT_ORIGIN;
      // If an OIDC session exists, redirect the browser to the OIDC logout endpoint.
      return res.oidc.logout({ returnTo });
    }
  } catch (err) {
    // ignore and continue to return a JSON response for API clients
  }

  // No OIDC session — respond OK for SPA to clear local state.
  return res.status(200).json({ message: "Logged out" });
});

// Login — validates credentials and returns user info
app.post("/api/login", async (req, res) => {
  const { email, password, role, rememberMe = false } = req.body || {};

  // Require all three fields
  if (!email || !password || !role) {
    return res.status(400).json({
      message: "email, password, and role are required"
    });
  }
  
  // Normalize inputs to avoid case mismatches
  const normalizedEmail = String(email).trim().toLowerCase();
  
  const normalizedRole = String(role).toLowerCase();
  if (normalizedRole !== "employee" && normalizedRole !== "employer") {
    return res.status(400).json({
      message: "role must be either employee or employer"
    });
  }

  try {
    // Look up the user by email and role
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

    // Compare the provided password against the stored hash
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
  } catch (err) {
    logger.error("login_error", {
      requestId: req.requestId,
      error: err.message
    });

    return res.status(500).json({
      message: "Internal server error. Please try again."
    });
  }
});

// GET /employees – list all employees with their shifts (employee and employer)
app.get("/employees", async (req, res) => {
  try {
    const { name } = req.query;
    const employees = await prisma.employee.findMany({
       where: {
        name: name ? {contains: String(name), mode: "insensitive"} : undefined
      },
      include: { 
        shifts: {
          include: {
            shiftInstance: {
              include : { shift: true }
          }
        }
      }
    }
  });
  res.json(employees);
  } catch (error) { 
    res.status(500).send(error instanceof Error ? error.message : "Unknown error"); 
  }
})

// POST /employees – register new employee (employer only)
app.post("/employees", async (req, res) => {
  // Check for employer role in headers
  try {
    const role = req.headers["x-role"];
    if (role !== "employer") {
      res.status(403).send("Forbidden: employer access only");
      return;
    }

    const { name, email } = employeeSchema.parse(req.body);

    const employee = await prisma.employee.create({
      data: { name, email }
    });
    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// GET /employee – get employee details (employee and employer)
app.get("/employee", async (_req, res) => {
  // For demonstration, we return the first employee. 
  try {
    const employees = await prisma.employee.findFirst()
    res.json(employees)
  } catch (error) {
    if(error instanceof Error){
      res.status(500).send(error.message)
    }
    res.status(500).send("Unknown error")
  }
})

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
    if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
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
    ? await prisma.availability.update({
        where: { id: existing.id },
        data: { status }
      })
      : await prisma.availability.create({
        data: { employeeId, shift_id, date: new Date(date), status }
      });
    
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) { 
      return res.status(400).json(error.flatten()); 
    }
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// GET /schedule – view full job schedule (employee and employer)
app.get("/schedule", async (req, res) => {
  try {
    const schedule = await prisma.shiftInstances.findMany({
      include: {
        shift: true,
        employees: {
          include: { employee: true }
        }
      }
    });
    res.json(schedule);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// PUT /schedule – employer assigns employees to shifts
app.put("/schedule", async (req, res) => {
  try {
    const role = req.headers["x-role"];
    if (role !== "employer") {
      res.status(403).send("Forbidden: employer access only");
      return;
    }

    const { employeeId, shiftInstanceId } = scheduleSchema.parse(req.body);
    const assignment = await prisma.employeeShift.create({
      data: {
        employeeId,
        shiftInstanceId
      },
      include: {
        employee: true,
        shiftInstance: { include: { shift: true } }
      }
    });

    res.json(assignment);

  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
    res.status(500).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
  const statusCode = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : Number.isInteger(err?.status)
      ? err.status
      : 500;

  logger.error("unhandled_error", {
    requestId: _req?.requestId,
    message: err.message,
    stack: err.stack
  });

  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    message: statusCode >= 400 && statusCode < 500
      ? (err.message || "Request failed")
      : "Internal server error"
  });
});

// Disconnect Prisma when the process exits
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT, clientOrigin: CLIENT_ORIGIN });
});

