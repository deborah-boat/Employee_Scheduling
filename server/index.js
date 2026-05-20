const dotenv = require("dotenv");

// Load environment variables from .env before requiring auth config.
dotenv.config();

const { logger } = require("./logger");
const { authMiddleware } = require("./Auth/auth");
const { createApp, prisma } = require("./app");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = createApp(prisma, { authMiddleware });

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT, clientOrigin: CLIENT_ORIGIN });
});