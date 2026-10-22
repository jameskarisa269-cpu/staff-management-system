
const Notification = require("../models/notificationModel");

const validId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const allowedTypes = [
  "General",
  "Task",
  "Attendance",
  "Asset",
  "System",
];

const notificationController = {
  // GET all notifications
  async getAll(req, res) {
    try {
      const { staff_id } = req.query;

      if (staff_id && !validId(staff_id)) {
        return res.status(400).json({
          message: "staff_id must be a positive integer.",
        });
      }

      const notifications = await Notification.getAll(
        staff_id ? Number(staff_id) : null
      );

      res.status(200).json({
        success: true,
        count: notifications.length,
        notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        message: "Failed to retrieve notifications.",
      });
    }
  },

  // GET one notification
  async getById(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid notification ID." });
      }

      const notification = await Notification.getById(req.params.id);

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found.",
        });
      }

      res.status(200).json({ success: true, notification });
    } catch (error) {
      console.error("Get notification error:", error);
      res.status(500).json({
        message: "Failed to retrieve notification.",
      });
    }
  },

  // CREATE notification
  async create(req, res) {
    try {
      const { staff_id, title, message, type } = req.body || {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200 ||
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          message: "A title (up to 200 characters) and message are required.",
        });
      }

      if (staff_id !== undefined && staff_id !== null && staff_id !== "") {
        if (!validId(staff_id)) {
          return res.status(400).json({
            message: "staff_id must be a positive integer.",
          });
        }
      }

      if (type && !allowedTypes.includes(type)) {
        return res.status(400).json({
          message: "Invalid notification type.",
          allowedTypes,
        });
      }

      const id = await Notification.create({
        staff_id: staff_id || null,
        title: title.trim(),
        message: message.trim(),
        type: type || "General",
      });

      const notification = await Notification.getById(id);

      res.status(201).json({
        success: true,
        message: "Notification created successfully.",
        notification,
      });
    } catch (error) {
      console.error("Create notification error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The specified staff member does not exist.",
        });
      }

      res.status(500).json({
        message: "Failed to create notification.",
      });
    }
  },

  // MARK one notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({ message: "Invalid notification ID." });
      }

      const affectedRows = await Notification.markAsRead(id);

      if (!affectedRows) {
        const notification = await Notification.getById(id);

        if (!notification) {
          return res.status(404).json({
            message: "Notification not found.",
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read.",
      });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({
        message: "Failed to update notification.",
      });
    }
  },

  // MARK all notifications as read
  async markAllAsRead(req, res) {
    try {
      const { staff_id } = req.body;

      if (staff_id && !validId(staff_id)) {
        return res.status(400).json({
          message: "staff_id must be a positive integer.",
        });
      }

      const updated = await Notification.markAllAsRead(
        staff_id ? Number(staff_id) : null
      );

      res.status(200).json({
        success: true,
        message: "Notifications marked as read.",
        updated,
      });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({
        message: "Failed to update notifications.",
      });
    }
  },

  // DELETE notification
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!validId(id)) {
        return res.status(400).json({ message: "Invalid notification ID." });
      }

      const deleted = await Notification.delete(id);

      if (!deleted) {
        return res.status(404).json({
          message: "Notification not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully.",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({
        message: "Failed to delete notification.",
      });
    }
  },
};

module.exports = notificationController;
