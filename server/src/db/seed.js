const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const bcrypt = require("bcryptjs");
const db = require("./database");

function seed() {
  // Create employer admin user
  const adminPassword = bcrypt.hashSync("admin123", 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role)
    VALUES (?, ?, 'employer')
  `).run("admin", adminPassword);

  // Insert mock employees
  const emp1 = db.prepare(`
    INSERT OR IGNORE INTO employees (name, email, phone, position, login_code)
    VALUES ('Ellen Johansson', 'ellen@sundsgarden.se', '070-111111', 'Waiter', 'code1')
  `).run();

  const emp2 = db.prepare(`
    INSERT OR IGNORE INTO employees (name, email, phone, position, login_code)
    VALUES ('Oskar Nilsson', 'oskar@sundsgarden.se', '070-222222', 'Waiter', 'code2')
  `).run();

  // Get employee ids (in case INSERT OR IGNORE skipped)
  const ellen = db.prepare("SELECT id FROM employees WHERE email = ?").get("ellen@sundsgarden.se");
  const oskar = db.prepare("SELECT id FROM employees WHERE email = ?").get("oskar@sundsgarden.se");

  // Create employee users linked to employees
  const ellenPassword = bcrypt.hashSync("code1", 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role, employee_id)
    VALUES (?, ?, 'employee', ?)
  `).run("ellen@sundsgarden.se", ellenPassword, ellen.id);

  const oskarPassword = bcrypt.hashSync("code2", 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, role, employee_id)
    VALUES (?, ?, 'employee', ?)
  `).run("oskar@sundsgarden.se", oskarPassword, oskar.id);

  // Insert seed schedules
  const weekStart = getMonday();
  db.prepare(`
    INSERT OR IGNORE INTO schedules (employee_id, day, shift, week_start)
    VALUES (?, 'Mon', 'morning', ?)
  `).run(ellen.id, weekStart);

  db.prepare(`
    INSERT OR IGNORE INTO schedules (employee_id, day, shift, week_start)
    VALUES (?, 'Mon', 'afternoon', ?)
  `).run(oskar.id, weekStart);

  console.log("Seed complete.");
}

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

seed();
