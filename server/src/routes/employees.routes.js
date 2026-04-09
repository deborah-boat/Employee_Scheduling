const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/employees.controller");

router.get("/", authenticate, ctrl.getAll);
router.get("/:id", authenticate, ctrl.getById);
router.post("/", authenticate, requireRole("employer"), ctrl.create);
router.put("/:id", authenticate, requireRole("employer"), ctrl.update);
router.delete("/:id", authenticate, requireRole("employer"), ctrl.remove);

module.exports = router;
