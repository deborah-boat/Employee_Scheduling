const express = require("express");
const { z, ZodError } = require("zod");

const scheduleSchema = z.object({
  employeeId: z.coerce.number().int(),
  date: z.string(),
  shift_id: z.coerce.number().int()
});

module.exports = function scheduleRouter(prisma, { requiresAuth }) {
  const router = express.Router();

  // GET /schedule — view full job schedule
  router.get("/schedule", async (_req, res) => {
    try {
      const schedule = await prisma.shiftInstances.findMany({
        include: { shift: true, employees: { include: { employee: true } } }
      });
      res.json(schedule);
    } catch (error) {
      res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
  });

  // PUT /schedule — employer assigns employee to a shift
  router.put("/schedule", requiresAuth(), async (req, res) => {
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

  // DELETE /schedule — employer removes employee from a shift
  router.delete("/schedule", requiresAuth(), async (req, res) => {
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

  return router;
};
