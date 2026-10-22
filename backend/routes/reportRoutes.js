
const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");

// Dashboard summary
router.get("/dashboard", reportController.getDashboardSummary);

// Individual reports
router.get("/staff", reportController.getStaffReport);
router.get("/departments", reportController.getDepartmentReport);
router.get("/attendance", reportController.getAttendanceReport);
router.get("/tasks", reportController.getTaskReport);
router.get("/assets", reportController.getAssetReport);

module.exports = router;
