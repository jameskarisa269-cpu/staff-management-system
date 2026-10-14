
const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const app = express();

app.use(cors());
app.use(express.json());

// Temporary diagnostic route
app.post("/test", (req, res) => {
    res.status(200).json({
        message: "POST route is working!"
    });
});

// Staff routes
const staffRoutes = require("./staff/staff.routes");
app.use("/api/staff", staffRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
