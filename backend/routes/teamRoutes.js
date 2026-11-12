const express = require("express");
const teamController = require("../controllers/teamController");

const router = express.Router();

router.get("/", teamController.getTeam);
router.patch("/:id/position", teamController.assignPosition);

module.exports = router;
