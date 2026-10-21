
const db = require("../config/database");
const crypto = require("crypto");

const Attendance = {
  // Create a secure QR attendance session
  async createSession(expiresAt) {
    const qrToken = crypto.randomBytes(32).toString("hex");

    const [result] = await db.query(
      `INSERT INTO attendance_sessions
       (qr_token, expires_at, status)
       VALUES (?, ?, 'Active')`,
      [qrToken, expiresAt]
    );

    return {
      id: result.insertId,
      qr_token: qrToken,
      expires_at: expiresAt,
    };
  },

  // Close an attendance session
  async closeSession(id) {
    const [result] = await db.query(
      `UPDATE attendance_sessions
       SET status = 'Closed'
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows) {
      return result.affectedRows;
    }

    const [sessions] = await db.query(
      "SELECT id FROM attendance_sessions WHERE id = ?",
      [id]
    );

    return sessions.length ? 0 : null;
  },

  // Record attendance using a valid QR session
  async checkIn(staffId, qrToken) {
    const [sessions] = await db.query(
      `SELECT id, expires_at
       FROM attendance_sessions
       WHERE qr_token = ?
         AND status = 'Active'
         AND expires_at > NOW()`,
      [qrToken]
    );

    if (sessions.length === 0) {
      const error = new Error("Invalid, expired, or closed QR session");
      error.statusCode = 400;
      throw error;
    }

    const sessionId = sessions[0].id;

    // Confirm the staff member exists
    const [staff] = await db.query(
      "SELECT id FROM staff WHERE id = ?",
      [staffId]
    );

    if (staff.length === 0) {
      const error = new Error("Staff member not found");
      error.statusCode = 404;
      throw error;
    }

    const [result] = await db.query(
      `INSERT INTO attendance_records
       (staff_id, session_id, attendance_date, check_in_time, status)
       VALUES (?, ?, CURDATE(), NOW(), 'Present')`,
      [staffId, sessionId]
    );

    return {
      id: result.insertId,
      staff_id: staffId,
      session_id: sessionId,
      attendance_date: new Date().toISOString().slice(0, 10),
      status: "Present",
    };
  },

  // Get all attendance records, with optional filters
  async getAll(filters = {}) {
    let sql = `
      SELECT
        a.*,
        s.employee_id,
        s.first_name,
        s.last_name,
        s.department,
        s.position
      FROM attendance_records a
      JOIN staff s ON a.staff_id = s.id
      WHERE 1 = 1
    `;

    const params = [];

    if (filters.staff_id) {
      sql += " AND a.staff_id = ?";
      params.push(filters.staff_id);
    }

    if (filters.date) {
      sql += " AND a.attendance_date = ?";
      params.push(filters.date);
    }

    sql += " ORDER BY a.attendance_date DESC, a.check_in_time DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },

  // Get one attendance record
  async getById(id) {
    const [rows] = await db.query(
      `SELECT a.*, s.employee_id, s.first_name, s.last_name
       FROM attendance_records a
       JOIN staff s ON a.staff_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    return rows[0];
  },

  // Correct an attendance record
  async update(id, data) {
    const { status, remarks } = data;

    const [result] = await db.query(
      `UPDATE attendance_records
       SET status = ?, remarks = ?
       WHERE id = ?`,
      [status, remarks || null, id]
    );

    return result.affectedRows;
  },

  // Delete an attendance record
  async delete(id) {
    const [result] = await db.query(
      "DELETE FROM attendance_records WHERE id = ?",
      [id]
    );

    return result.affectedRows;
  },
};

module.exports = Attendance;
