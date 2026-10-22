
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

const staffRoutes = require("./routes/staffRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const taskRoutes = require("./routes/taskRoutes");
const assetRoutes = require("./routes/assetRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditLogRoutes = require("./routes/auditlogRoutes");
const AuditLog = require("./models/auditlogModel");

const auditedModules = {
    staff: "Staff",
    attendance: "Attendance",
    departments: "Department",
    tasks: "Task",
    assets: "Asset",
    notifications: "Notification"
};

app.use((req, res, next) => {
    const match = req.path.match(/^\/api\/(staff|attendance|departments|tasks|assets|notifications)(?:\/(\d+))?/);
    const methods = {
        POST: "Create",
        PUT: "Update",
        PATCH: "Update",
        DELETE: "Delete"
    };
    const action = methods[req.method];

    if (match && action) {
        res.on("finish", () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return;
            }

            AuditLog.create({
                user_id: null,
                action,
                module: auditedModules[match[1]],
                record_id: match[2] ? Number(match[2]) : null,
                description: `${req.method} ${req.path} completed successfully (HTTP ${res.statusCode}).`,
                ip_address: req.ip
            }).catch((error) => {
                console.error("Failed to record audit log:", error);
            });
        });
    }

    next();
});

app.use("/api/staff", staffRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditLogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
