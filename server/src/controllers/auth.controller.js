const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/database");

function login(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "username, password and role are required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(401).json({ error: "Role mismatch" });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employee_id || null
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "changeme", { expiresIn: "7d" });

    return res.json({
      token,
      user: payload
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { login };
