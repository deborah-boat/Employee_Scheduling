const express = require("express");
const { logger } = require("../logger");

const rawClientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const CLIENT_ORIGIN = rawClientOrigin.startsWith("http") ? rawClientOrigin : `https://${rawClientOrigin}`;

function normalizeRole(value) {
  const role = String(value || "").toLowerCase();
  return role === "employer" || role === "employee" ? role : "employee";
}

function getLogoutReturnTo() {
  return process.env.AUTH0_POST_LOGOUT_REDIRECT || CLIENT_ORIGIN;
}

module.exports = function authRouter(prisma, { bcrypt }) {
  const router = express.Router();

  // Health check — used to verify the server is reachable
  router.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  router.get("/api/auth/login", (req, res) => {
    const role = normalizeRole(req.query.role);
    const returnTo = `${CLIENT_ORIGIN}/?role=${encodeURIComponent(role)}`;
    return res.oidc.login({ returnTo, authorizationParams: { prompt: "login" } });
  });

  router.get("/api/auth/session", (req, res) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const role = normalizeRole(req.query.role);
    const oidcUser = req.oidc.user || {};
    return res.status(200).json({
      user: {
        id: oidcUser.sub,
        email: oidcUser.email || "",
        role,
        displayName: oidcUser.name || oidcUser.nickname || oidcUser.email || "User"
      }
    });
  });

  router.get("/api/auth/logout", (_req, res) => {
    return res.oidc.logout({ returnTo: getLogoutReturnTo() });
  });

  router.post("/api/auth/logout", (req, res) => {
    try {
      if (req.oidc && typeof req.oidc.isAuthenticated === "function" && req.oidc.isAuthenticated()) {
        return res.oidc.logout({ returnTo: getLogoutReturnTo() });
      }
    } catch (err) {
      // ignore and continue to return a JSON response for API clients
    }
    return res.status(200).json({ message: "Logged out" });
  });

  // POST /api/login — validates credentials and returns user info
  router.post("/api/login", async (req, res) => {
    const { email, password, role, rememberMe = false } = req.body || {};

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password, and role are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = String(role).toLowerCase();

    if (normalizedRole !== "employee" && normalizedRole !== "employer") {
      return res.status(400).json({ message: "role must be either employee or employer" });
    }

    try {
      const user = await prisma.user.findFirst({
        where: { email: normalizedEmail, role: normalizedRole }
      });

      if (!user) {
        logger.warn("login_failed_user_not_found", { requestId: req.requestId, email: normalizedEmail });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn("login_failed_invalid_password", { requestId: req.requestId, userId: user.id });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      logger.info("login_success", { requestId: req.requestId, userId: user.id });

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
    } catch (err) {
      logger.error("login_error", { requestId: req.requestId, error: err.message });
      return res.status(500).json({ message: "Internal server error. Please try again." });
    }
  });

  return router;
};
