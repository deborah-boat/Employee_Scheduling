const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const Database = require("better-sqlite3");
const fs = require("fs");

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, "../../", process.env.DB_PATH)
  : path.join(__dirname, "../../data/employee_scheduling.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    position TEXT NOT NULL DEFAULT 'Waiter',
    login_code TEXT,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('employer', 'employee')),
    employee_id INTEGER REFERENCES employees(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    day TEXT NOT NULL CHECK(day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
    shift TEXT NOT NULL CHECK(shift IN ('morning','afternoon','night')),
    week_start TEXT NOT NULL DEFAULT (date('now', 'weekday 1', '-7 days')),
    UNIQUE(day, shift, week_start)
  );

  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK(day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
    shift TEXT NOT NULL CHECK(shift IN ('morning','afternoon','night')),
    status TEXT NOT NULL CHECK(status IN ('available','unavailable')) DEFAULT 'unavailable',
    UNIQUE(employee_id, day, shift)
  );
`);

module.exports = db;
