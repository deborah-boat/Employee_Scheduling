const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/schedule.controller");

router.get("/", authenticate, ctrl.getSchedule);
router.put("/:day/:shift", authenticate, requireRole("employer"), ctrl.assignShift);

module.exports = router;
