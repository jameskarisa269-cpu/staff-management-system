
const db = require("../config/database");

const Notification = {
  async getAll(staffId = null) {
    if (staffId) {
      const [rows] = await db.query(
        `SELECT
          n.id,
          n.staff_id,
          n.title,
          n.message,
          n.type,
          CASE WHEN nr.notification_id IS NULL THEN FALSE ELSE TRUE END AS is_read,
          n.created_at,
          s.employee_id,
          s.first_name,
          s.last_name
        FROM notifications n
        LEFT JOIN staff s ON s.id = n.staff_id
        LEFT JOIN notification_reads nr
          ON nr.notification_id = n.id AND nr.staff_id = ?
        WHERE n.staff_id = ? OR n.staff_id IS NULL
        ORDER BY n.created_at DESC`,
        [staffId, staffId]
      );
      return rows;
    }

    const sql = `
      SELECT
        n.*,
        s.employee_id,
        s.first_name,
        s.last_name
      FROM notifications n
      LEFT JOIN staff s ON s.id = n.staff_id
      ORDER BY n.created_at DESC
    `;

    const [rows] = await db.query(sql);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE id = ?",
      [id]
    );

    return rows[0];
  },

  async create(data) {
    const { staff_id, title, message, type } = data;

    const [result] = await db.query(
      `INSERT INTO notifications
        (staff_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [staff_id || null, title, message, type || "General"]
    );

    return result.insertId;
  },

  async markAsRead(id, staffId = null) {
    const [result] = staffId
      ? await db.query(
          `INSERT INTO notification_reads (notification_id, staff_id)
           SELECT id, ? FROM notifications
           WHERE id = ? AND (staff_id = ? OR staff_id IS NULL)
           ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
          [staffId, id, staffId]
        )
      : await db.query(
          "UPDATE notifications SET is_read = TRUE WHERE id = ?",
          [id]
        );

    return result.affectedRows;
  },

  async markAllAsRead(staffId) {
    if (staffId) {
      const [result] = await db.query(
        `INSERT INTO notification_reads (notification_id, staff_id)
         SELECT id, ? FROM notifications
         WHERE staff_id = ? OR staff_id IS NULL
         ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
        [staffId, staffId]
      );
      return result.affectedRows;
    }

    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE is_read = FALSE
    `;

    const [result] = await db.query(sql);
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await db.query(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    return result.affectedRows;
  },
};

module.exports = Notification;
