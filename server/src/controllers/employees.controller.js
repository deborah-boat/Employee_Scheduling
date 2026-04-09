const bcrypt = require("bcryptjs");
const db = require("../db/database");

function getAll(req, res) {
  try {
    const employees = db.prepare("SELECT * FROM employees ORDER BY id").all();
    return res.json(employees);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function getById(req, res) {
  try {
    const employee = db.prepare("SELECT * FROM employees WHERE id = ?").get(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    return res.json(employee);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function create(req, res) {
  try {
    const { name, email, phone, position, loginCode, profilePicture } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const insertEmployee = db.prepare(`
      INSERT INTO employees (name, email, phone, position, login_code, profile_picture)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertEmployee.run(
      name,
      email || null,
      phone || null,
      position || "Waiter",
      loginCode || null,
      profilePicture || null
    );

    const newEmployee = db.prepare("SELECT * FROM employees WHERE id = ?").get(result.lastInsertRowid);

    // Automatically create a linked user account
    if (email && loginCode) {
      const passwordHash = bcrypt.hashSync(loginCode, 10);
      db.prepare(`
        INSERT OR IGNORE INTO users (username, password_hash, role, employee_id)
        VALUES (?, ?, 'employee', ?)
      `).run(email, passwordHash, newEmployee.id);
    }

    return res.status(201).json(newEmployee);
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: err.message });
  }
}

function update(req, res) {
  try {
    const { name, email, phone, position, loginCode, profilePicture } = req.body;
    const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Employee not found" });

    db.prepare(`
      UPDATE employees
      SET name = ?, email = ?, phone = ?, position = ?, login_code = ?, profile_picture = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      email !== undefined ? email : existing.email,
      phone !== undefined ? phone : existing.phone,
      position !== undefined ? position : existing.position,
      loginCode !== undefined ? loginCode : existing.login_code,
      profilePicture !== undefined ? profilePicture : existing.profile_picture,
      req.params.id
    );

    const updated = db.prepare("SELECT * FROM employees WHERE id = ?").get(req.params.id);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function remove(req, res) {
  try {
    const existing = db.prepare("SELECT * FROM employees WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Employee not found" });

    db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove };
