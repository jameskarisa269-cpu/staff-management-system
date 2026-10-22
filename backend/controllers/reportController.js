
const Report = require("../models/reportModel");

const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const validId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const reportController = {
  async getDashboardSummary(req, res) {
    try {
      const summary = await Report.getDashboardSummary();
      res.status(200).json({ success: true, summary });
    } catch (error) {
      console.error("Dashboard report error:", error);
      res.status(500).json({ message: "Failed to generate dashboard report." });
    }
  },

  async getStaffReport(req, res) {
    try {
      const staff = await Report.getStaffReport();
      res.status(200).json({
        success: true,
        count: staff.length,
        staff,
      });
    } catch (error) {
      console.error("Staff report error:", error);
      res.status(500).json({ message: "Failed to generate staff report." });
    }
  },

  async getDepartmentReport(req, res) {
    try {
      const departments = await Report.getDepartmentReport();
      res.status(200).json({
        success: true,
        count: departments.length,
        departments,
      });
    } catch (error) {
      console.error("Department report error:", error);
      res.status(500).json({
        message: "Failed to generate department report.",
      });
    }
  },

  async getAttendanceReport(req, res) {
    try {
      const { startDate, endDate, staffId } = req.query;

      if (
        (startDate && !validDate(startDate)) ||
        (endDate && !validDate(endDate))
      ) {
        return res.status(400).json({
          message: "Dates must use the YYYY-MM-DD format.",
        });
      }

      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({
          message: "startDate cannot be later than endDate.",
        });
      }

      if (staffId && !validId(staffId)) {
        return res.status(400).json({
          message: "staffId must be a positive integer.",
        });
      }

      const attendance = await Report.getAttendanceReport({
        startDate,
        endDate,
        staffId,
      });

      res.status(200).json({
        success: true,
        count: attendance.length,
        attendance,
      });
    } catch (error) {
      console.error("Attendance report error:", error);
      res.status(500).json({
        message: "Failed to generate attendance report.",
      });
    }
  },

  async getTaskReport(req, res) {
    try {
      const { status, startDate, endDate } = req.query;

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Completed",
        "Cancelled",
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid task status.",
          allowedStatuses,
        });
      }

      if (
        (startDate && !validDate(startDate)) ||
        (endDate && !validDate(endDate))
      ) {
        return res.status(400).json({
          message: "Dates must use the YYYY-MM-DD format.",
        });
      }

      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({
          message: "startDate cannot be later than endDate.",
        });
      }

      const tasks = await Report.getTaskReport({
        status,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        count: tasks.length,
        tasks,
      });
    } catch (error) {
      console.error("Task report error:", error);
      res.status(500).json({ message: "Failed to generate task report." });
    }
  },

  async getAssetReport(req, res) {
    try {
      const { status, category } = req.query;

      const allowedStatuses = [
        "Available",
        "Assigned",
        "Under Maintenance",
        "Retired",
        "Lost",
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid asset status.",
          allowedStatuses,
        });
      }

      const assets = await Report.getAssetReport({ status, category });

      res.status(200).json({
        success: true,
        count: assets.length,
        assets,
      });
    } catch (error) {
      console.error("Asset report error:", error);
      res.status(500).json({ message: "Failed to generate asset report." });
    }
  },
};

module.exports = reportController;
