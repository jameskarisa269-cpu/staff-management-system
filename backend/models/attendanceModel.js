
const db = require("../config/database");
const crypto = require("crypto");

const Attendance = {
  async getActiveSession() {
    const [rows] = await db.query(
      `SELECT id, qr_token, expires_at
       FROM attendance_sessions
       WHERE status = 'Active' AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`
    );

    return rows[0] || null;
  },

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

  async createRecord({ staffId, attendanceDate, status, checkInTime, remarks }) {
    const [staff] = await db.query(
      "SELECT id FROM staff WHERE id = ?",
      [staffId]
    );

    if (staff.length === 0) {
      const error = new Error("Staff member not found.");
      error.statusCode = 404;
      throw error;
    }

    const checkInDateTime = checkInTime
      ? `${attendanceDate} ${checkInTime}:00`
      : null;
    const [result] = await db.query(
      `INSERT INTO attendance_records
       (staff_id, session_id, attendance_date, check_in_time, status, remarks)
       VALUES (?, NULL, ?, ?, ?, ?)`,
      [staffId, attendanceDate, checkInDateTime, status, remarks]
    );

    return {
      id: result.insertId,
      staff_id: staffId,
      session_id: null,
      attendance_date: attendanceDate,
      check_in_time: checkInDateTime,
      status,
      remarks,
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
        COALESCE(d.department_name, s.department) AS department,
        s.position
      FROM attendance_records a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN departments d ON d.id = s.department_id
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
       SET status = ?,
           remarks = ?,
           check_in_time = CASE WHEN ? = 'Absent' THEN NULL ELSE check_in_time END
       WHERE id = ?`,
      [status, remarks || null, status, id]
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
