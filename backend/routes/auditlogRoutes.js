const express = require("express");
const router = express.Router();

const auditLogController = require("../controllers/auditlogController");

router.get("/", auditLogController.getAll);
router.get("/:id", auditLogController.getById);
router.post("/", auditLogController.create);

module.exports = router;