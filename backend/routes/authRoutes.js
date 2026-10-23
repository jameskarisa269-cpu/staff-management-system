const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/config", authController.getConfig);
router.post("/login", authController.login);

module.exports = router;
