
const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { requireRole } = require("../middleware/auth");

router.get("/", notificationController.getAll);
router.get("/:id", requireRole("admin"), notificationController.getById);

router.post("/", requireRole("admin"), notificationController.create);

router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

router.delete("/:id", requireRole("admin"), notificationController.delete);

module.exports = router;
