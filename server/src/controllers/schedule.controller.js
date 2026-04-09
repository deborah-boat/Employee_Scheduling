const db = require("../db/database");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFTS = ["morning", "afternoon", "night"];

function buildEmptySchedule() {
  const schedule = {};
  DAYS.forEach((d) => {
    schedule[d] = {};
    SHIFTS.forEach((s) => (schedule[d][s] = null));
  });
  return schedule;
}

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function getSchedule(req, res) {
  try {
    const weekStart = req.query.week_start || getMonday();
    const rows = db
      .prepare("SELECT * FROM schedules WHERE week_start = ?")
      .all(weekStart);

    const schedule = buildEmptySchedule();
    rows.forEach((row) => {
      if (DAYS.includes(row.day) && SHIFTS.includes(row.shift)) {
        schedule[row.day][row.shift] = row.employee_id;
      }
    });

    return res.json(schedule);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function assignShift(req, res) {
  try {
    const { day, shift } = req.params;
    const { employeeId, week_start } = req.body;

    if (!DAYS.includes(day)) {
      return res.status(400).json({ error: "Invalid day" });
    }
    if (!SHIFTS.includes(shift)) {
      return res.status(400).json({ error: "Invalid shift" });
    }

    const weekStart = week_start || getMonday();

    if (employeeId === null || employeeId === undefined) {
      // Remove assignment for this slot
      db.prepare(
        "DELETE FROM schedules WHERE day = ? AND shift = ? AND week_start = ?"
      ).run(day, shift, weekStart);
    } else {
      db.prepare(`
        INSERT INTO schedules (employee_id, day, shift, week_start)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(day, shift, week_start) DO UPDATE SET employee_id = excluded.employee_id
      `).run(employeeId, day, shift, weekStart);
    }

    const rows = db
      .prepare("SELECT * FROM schedules WHERE week_start = ?")
      .all(weekStart);

    const schedule = buildEmptySchedule();
    rows.forEach((row) => {
      if (DAYS.includes(row.day) && SHIFTS.includes(row.shift)) {
        schedule[row.day][row.shift] = row.employee_id;
      }
    });

    return res.json(schedule);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getSchedule, assignShift };
