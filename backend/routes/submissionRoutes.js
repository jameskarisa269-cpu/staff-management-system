const express = require("express");
const submissionController = require("../controllers/submissionController");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/reports", submissionController.getReports);
router.post("/reports", requireRole("staff"), submissionController.createReport);
router.get("/weekly-briefs", submissionController.getWeeklyBriefs);
router.post("/weekly-briefs", requireRole("staff"), submissionController.saveWeeklyBrief);

module.exports = router;
