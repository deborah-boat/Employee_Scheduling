const express = require("express");
const { z, ZodError } = require("zod");

const employeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

module.exports = function employeesRouter(prisma, { requiresAuth }) {
  const router = express.Router();

  // GET /employees — list all employees (optionally filtered by name)
  router.get("/employees", async (req, res) => {
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

  // POST /employees — register new employee (employer only)
  router.post("/employees", requiresAuth(), async (req, res) => {
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

  // GET /employee — get first employee record
  router.get("/employee", async (_req, res) => {
    try {
      const employee = await prisma.employee.findFirst();
      res.json(employee);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // DELETE /employees/:id — employer only
  router.delete("/employees/:id", requiresAuth(), async (req, res) => {
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

  return router;
};
