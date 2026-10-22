
const db = require("../config/database");

const Notification = {
  async getAll(staffId = null) {
    let sql = `
      SELECT
        n.*,
        s.employee_id,
        s.first_name,
        s.last_name
      FROM notifications n
      LEFT JOIN staff s ON s.id = n.staff_id
    `;

    const params = [];

    if (staffId) {
      sql += " WHERE n.staff_id = ? OR n.staff_id IS NULL";
      params.push(staffId);
    }

    sql += " ORDER BY n.created_at DESC";

    const [rows] = await db.query(sql, params);
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

  async markAsRead(id) {
    const [result] = await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ?",
      [id]
    );

    return result.affectedRows;
  },

  async markAllAsRead(staffId) {
    let sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE is_read = FALSE
    `;

    const params = [];

    if (staffId) {
      sql += " AND (staff_id = ? OR staff_id IS NULL)";
      params.push(staffId);
    }

    const [result] = await db.query(sql, params);
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
