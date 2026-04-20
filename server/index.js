const express = require ("express");
const bcrypt = require ("bcrypt");
const cors = require ("cors");
const dotenv = require("dotenv");
const { randomUUID } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { logger, sanitizeObject } = require("./logger");
const {z, ZodError} = require ("zod");

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Read the database URL from environment
const databaseUrl = process.env.DATABASE_URL;
// Crash early if the database URL is missing
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

app.use(cors({
  origin: CLIENT_ORIGIN
}));
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
  date: z.string(),
  shift_id: z.coerce.number().int()
})

// Health check — used to verify the server is reachable
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
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

    const { employeeId, date, shift_id } = scheduleSchema.parse(req.body);

    // Find or create the shift instance for this date + shift
    let shiftInstance = await prisma.shiftInstances.findFirst({
      where: { shift_id, date: new Date(date) }
    });
    if (!shiftInstance) {
      shiftInstance = await prisma.shiftInstances.create({
        data: { shift_id, date: new Date(date) }
      });
    }

    // Create assignment only if it doesn't already exist
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

// DELETE /schedule – employer removes an employee from a shift
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
  logger.error("unhandled_error", {
    requestId: _req?.requestId,
    message: err.message,
    stack: err.stack
  });

  res.status(500).json({ message: "Internal server error" });
});

// Disconnect Prisma when the process exits
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    clientOrigin: CLIENT_ORIGIN
  });
});
