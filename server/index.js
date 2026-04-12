const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { email, password, role, rememberMe = false } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({
      message: "email, password, and role are required"
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const normalizedRole = String(role).toLowerCase();
  if (normalizedRole !== "employee" && normalizedRole !== "employer") {
    return res.status(400).json({
      message: "role must be either employee or employer"
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      role: normalizedRole
    }
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  return res.status(200).json({
    message: "Login successful",
    token: `demo-token-${user.id}`,
    session: {
      rememberMe: Boolean(rememberMe),
      expiresIn: Boolean(rememberMe) ? "30d" : "session"
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    }
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
