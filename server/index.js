const dotenv = require("dotenv");
dotenv.config();

const { createApp, prisma } = require("./app");
const { logger } = require("./logger");

const app = createApp(prisma);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Crash early if the database URL is missing
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT, clientOrigin: CLIENT_ORIGIN });
});

