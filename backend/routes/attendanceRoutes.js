
const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");

// QR attendance sessions
router.post("/sessions", attendanceController.createSession);
router.patch(
  "/sessions/:id/close",
  attendanceController.closeSession
);

// Staff check-in
router.post("/check-in", attendanceController.checkIn);

// Attendance records
router.get("/", attendanceController.getAll);
router.get("/:id", attendanceController.getById);
router.put("/:id", attendanceController.update);
router.delete("/:id", attendanceController.delete);

module.exports = router;
