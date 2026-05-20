const dotenv = require("dotenv");
dotenv.config();

const { createApp, prisma } = require("./app");
const { logger } = require("./logger");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = createApp(prisma);

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT, clientOrigin: CLIENT_ORIGIN });
});
