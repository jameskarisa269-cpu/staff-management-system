const db = require("../config/database");

const AuditLog = {
  async getAll(filters = {}) {
    let sql = `
      SELECT
        a.*,
        s.employee_id,
        s.first_name,
        s.last_name
      FROM audit_logs a
      LEFT JOIN staff s ON s.id = a.user_id
      WHERE 1 = 1
    `;

    const params = [];

    if (filters.user_id) {
      sql += " AND a.user_id = ?";
      params.push(filters.user_id);
    }

    if (filters.module) {
      sql += " AND a.module = ?";
      params.push(filters.module);
    }

    if (filters.action) {
      sql += " AND a.action = ?";
      params.push(filters.action);
    }

    if (filters.start_date) {
      sql += " AND a.created_at >= ?";
      params.push(`${filters.start_date} 00:00:00`);
    }

    if (filters.end_date) {
      sql += " AND a.created_at <= ?";
      params.push(`${filters.end_date} 23:59:59`);
    }

    sql += " ORDER BY a.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT
         a.*,
         s.employee_id,
         s.first_name,
         s.last_name
       FROM audit_logs a
       LEFT JOIN staff s ON s.id = a.user_id
       WHERE a.id = ?`,
      [id]
    );

    return rows[0];
  },

  async create(data) {
    const {
      user_id,
      action,
      module,
      record_id,
      description,
      ip_address
    } = data;

    const [result] = await db.query(
      `INSERT INTO audit_logs
        (user_id, action, module, record_id, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        action,
        module,
        record_id || null,
        description || null,
        ip_address || null
      ]
    );

    return result.insertId;
  }
};

module.exports = AuditLog;