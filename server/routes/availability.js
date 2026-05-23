const express = require("express");
const { z, ZodError } = require("zod");

const availabilitySchema = z.object({
  date: z.string(),
  shift_id: z.coerce.number().int(),
  status: z.string()
});

module.exports = function availabilityRouter(prisma, { requiresAuth }) {
  const router = express.Router();

  // GET /availability/:id — get employee availability
  router.get("/availability/:id", async (req, res) => {
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

  // PUT /availability/:id — employee sets own availability
  router.put("/availability/:id", requiresAuth(), async (req, res) => {
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

  return router;
};
