const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const employeesRoutes = require("./routes/employees.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const availabilityRoutes = require("./routes/availability.routes");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/availability", availabilityRoutes);

// Generic error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
