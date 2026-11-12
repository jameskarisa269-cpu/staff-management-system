const express = require("express");
const authController = require("../controllers/authController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/config", authController.getConfig);
router.post("/login", authController.login);
router.post("/account-requests", authController.createAccountRequest);
router.get(
  "/account-requests",
  authenticate,
  requireRole("admin"),
  authController.getAccountRequests,
);
router.post(
  "/account-requests/:id/approve",
  authenticate,
  requireRole("admin"),
  authController.approveAccountRequest,
);
router.post(
  "/account-requests/:id/reject",
  authenticate,
  requireRole("admin"),
  authController.rejectAccountRequest,
);

module.exports = router;
