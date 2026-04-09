const db = require("../db/database");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = ["morning", "afternoon", "night"];

function buildEmptyAvailability() {
  const availability = {};
  DAYS.forEach((d) => {
    availability[d] = {};
    SHIFTS.forEach((s) => (availability[d][s] = "unavailable"));
  });
  return availability;
}

function getAvailability(req, res) {
  try {
    const { employeeId } = req.params;

    const rows = db
      .prepare("SELECT * FROM availability WHERE employee_id = ?")
      .all(employeeId);

    const availability = buildEmptyAvailability();
    rows.forEach((row) => {
      if (DAYS.includes(row.day) && SHIFTS.includes(row.shift)) {
        availability[row.day][row.shift] = row.status;
      }
    });

    return res.json(availability);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function setAvailability(req, res) {
  try {
    const { employeeId, day, shift } = req.params;
    const { status } = req.body;

    if (!DAYS.includes(day)) {
      return res.status(400).json({ error: "Invalid day" });
    }
    if (!SHIFTS.includes(shift)) {
      return res.status(400).json({ error: "Invalid shift" });
    }
    if (!["available", "unavailable"].includes(status)) {
      return res.status(400).json({ error: "status must be 'available' or 'unavailable'" });
    }

    // Employee can only update their own availability; employer can update any
    if (req.user.role === "employee" && req.user.employeeId !== Number(employeeId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare(`
      INSERT INTO availability (employee_id, day, shift, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(employee_id, day, shift) DO UPDATE SET status = excluded.status
    `).run(employeeId, day, shift, status);

    const rows = db
      .prepare("SELECT * FROM availability WHERE employee_id = ?")
      .all(employeeId);

    const availability = buildEmptyAvailability();
    rows.forEach((row) => {
      if (DAYS.includes(row.day) && SHIFTS.includes(row.shift)) {
        availability[row.day][row.shift] = row.status;
      }
    });

    return res.json(availability);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getAvailability, setAvailability };
