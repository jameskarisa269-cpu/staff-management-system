const AuditLog = require("../models/auditlogModel");

const validModules = [
  "Staff",
  "Department",
  "Role",
  "Attendance",
  "Task",
  "Asset",
  "Report",
  "Notification",
  "Authentication",
  "System"
];

const auditLogController = {
  // GET all audit logs with optional filters
  async getAll(req, res) {
    try {
      const { user_id, module, action, start_date, end_date } = req.query;

      if (
        user_id &&
        (!Number.isInteger(Number(user_id)) || Number(user_id) < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "user_id must be a positive integer."
        });
      }

      if (start_date && Number.isNaN(Date.parse(start_date))) {
        return res.status(400).json({
          success: false,
          message: "Invalid start_date. Use YYYY-MM-DD."
        });
      }

      if (end_date && Number.isNaN(Date.parse(end_date))) {
        return res.status(400).json({
          success: false,
          message: "Invalid end_date. Use YYYY-MM-DD."
        });
      }

      const logs = await AuditLog.getAll({
        user_id,
        module,
        action,
        start_date,
        end_date
      });

      return res.status(200).json({
        success: true,
        count: logs.length,
        audit_logs: logs
      });
    } catch (error) {
      console.error("Get audit logs error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs."
      });
    }
  },

  // GET one audit log by ID
  async getById(req, res) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit log ID."
        });
      }

      const log = await AuditLog.getById(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Audit log not found."
        });
      }

      return res.status(200).json({
        success: true,
        audit_log: log
      });
    } catch (error) {
      console.error("Get audit log error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit log."
      });
    }
  },

  // POST a new audit log entry
  async create(req, res) {
    try {
      const {
        user_id,
        action,
        module,
        record_id,
        description,
        ip_address
      } = req.body;

      if (
        !action ||
        typeof action !== "string" ||
        !action.trim() ||
        !module ||
        typeof module !== "string" ||
        !module.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "action and module are required."
        });
      }

      if (!validModules.includes(module)) {
        return res.status(400).json({
          success: false,
          message: `module must be one of: ${validModules.join(", ")}.`
        });
      }

      if (
        user_id !== undefined &&
        user_id !== null &&
        (!Number.isInteger(Number(user_id)) || Number(user_id) < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "user_id must be a positive integer or null."
        });
      }

      if (
        record_id !== undefined &&
        record_id !== null &&
        (!Number.isInteger(Number(record_id)) || Number(record_id) < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "record_id must be a positive integer or null."
        });
      }

      const logId = await AuditLog.create({
        user_id: user_id || null,
        action: action.trim(),
        module,
        record_id: record_id || null,
        description: description || null,
        ip_address: ip_address || null
      });

      return res.status(201).json({
        success: true,
        message: "Audit log created successfully.",
        id: logId
      });
    } catch (error) {
      console.error("Create audit log error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          success: false,
          message: "The specified user does not exist."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create audit log."
      });
    }
  }
};

module.exports = auditLogController;