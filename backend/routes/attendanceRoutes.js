
const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const { requireRole } = require("../middleware/auth");

// QR attendance sessions
router.get(
  "/sessions/active",
  requireRole("admin", "staff"),
  attendanceController.getActiveSession
);
router.post("/sessions", requireRole("admin"), attendanceController.createSession);
router.patch(
  "/sessions/:id/close",
  requireRole("admin"),
  attendanceController.closeSession
);

// Staff check-in
router.post("/check-in", attendanceController.checkIn);

// Attendance records
router.post("/", requireRole("admin"), attendanceController.createRecord);
router.get("/", attendanceController.getAll);
router.get("/:id", requireRole("admin"), attendanceController.getById);
router.put("/:id", requireRole("admin"), attendanceController.update);
router.delete("/:id", requireRole("admin"), attendanceController.delete);

module.exports = router;
