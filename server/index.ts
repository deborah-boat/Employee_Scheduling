import express from 'express'
import 'dotenv/config' 
import { PrismaClient } from './prisma/generated/prisma/client.js';
import { z, ZodError } from 'zod'

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

// Use DATABASE_URL from .env for PrismaPg adapter
const databaseUrl = process.env.DATABASE_URL;

// Ensure DATABASE_URL is set
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// Initialize Prisma Client
const prisma = new PrismaClient()
 
// Create Express app
const app = express()
app.use(express.json())

// GET /employee – get employee details (employee and employer)
app.get("/employee", async (req, res) => {
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

// GET /employees – list all employees with their shifts (employee and employer)
app.get("/employees", async (req, res) => {
// Optional query parameter to filter by name
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

    } catch (error) 
  { res.status(500).send(error instanceof Error ? error.message : "Unknown error"); }
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

    let availability;
    if (existing) {
      availability = await prisma.availability.update({
        where: { id: existing.id },
        data: { status }
      });
    } else {
      availability = await prisma.availability.create({
        data: { employeeId, shift_id, date: new Date(date), status }
      });
    }

    res.json(availability);
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json(error.flatten()); return; }
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

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) { res.status(400).json(err.flatten()); return; }
  res.status(500).send(err instanceof Error ? err.message : "Unknown error");
});

app.listen(5000, () => {
  console.log(`Server is running on port 5000`)
})
