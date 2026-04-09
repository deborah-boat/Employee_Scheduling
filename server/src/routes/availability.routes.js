const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/availability.controller");

router.get("/:employeeId", authenticate, ctrl.getAvailability);
router.put("/:employeeId/:day/:shift", authenticate, ctrl.setAvailability);

module.exports = router;
