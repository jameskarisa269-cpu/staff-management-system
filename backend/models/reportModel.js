
const db = require("../config/database");

const Report = {
  // Dashboard summary
  async getDashboardSummary() {
    const [staff] = await db.query(`
      SELECT
        COUNT(*) AS total_staff,
        COALESCE(SUM(employment_status = 'Active'), 0) AS active_staff,
        COALESCE(SUM(employment_status = 'Inactive'), 0) AS inactive_staff
      FROM staff
    `);

    const [departments] = await db.query(`
      SELECT
        COUNT(*) AS total_departments,
        COALESCE(SUM(status = 'Active'), 0) AS active_departments,
        COALESCE(SUM(status = 'Inactive'), 0) AS inactive_departments
      FROM departments
    `);

    const [attendance] = await db.query(`
      SELECT
        COUNT(*) AS total_records,
        COALESCE(SUM(status = 'Present'), 0) AS present,
        COALESCE(SUM(status = 'Late'), 0) AS late,
        COALESCE(SUM(status = 'Absent'), 0) AS absent
      FROM attendance_records
    `);

    const [tasks] = await db.query(`
      SELECT
        COUNT(*) AS total_tasks,
        COALESCE(SUM(status = 'Pending'), 0) AS pending,
        COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
        COALESCE(SUM(status = 'Completed'), 0) AS completed,
        COALESCE(SUM(status = 'Cancelled'), 0) AS cancelled
      FROM tasks
    `);

    const [assets] = await db.query(`
      SELECT
        COUNT(*) AS total_assets,
        COALESCE(SUM(status = 'Available'), 0) AS available,
        COALESCE(SUM(status = 'Assigned'), 0) AS assigned,
        COALESCE(SUM(status = 'Under Maintenance'), 0) AS under_maintenance,
        COALESCE(SUM(status = 'Retired'), 0) AS retired,
        COALESCE(SUM(status = 'Lost'), 0) AS lost
      FROM assets
    `);

    return {
      staff: staff[0],
      departments: departments[0],
      attendance: attendance[0],
      tasks: tasks[0],
      assets: assets[0],
    };
  },

  // Staff report
  async getStaffReport() {
    const [rows] = await db.query(`
      SELECT
        id,
        employee_id,
        first_name,
        last_name,
        email,
        department,
        position,
        employment_status,
        created_at
      FROM staff
      ORDER BY created_at DESC
    `);

    return rows;
  },

  // Department report
  async getDepartmentReport() {
    const [rows] = await db.query(`
      SELECT
        d.id,
        d.department_name,
        d.description,
        d.status,
        COUNT(s.id) AS total_staff,
        SUM(s.employment_status = 'Active') AS active_staff
      FROM departments d
      LEFT JOIN staff s
        ON s.department = d.department_name
      GROUP BY
        d.id,
        d.department_name,
        d.description,
        d.status
      ORDER BY d.department_name
    `);

    return rows;
  },

  // Attendance report with optional date filters
  async getAttendanceReport({ startDate, endDate, staffId }) {
    let sql = `
      SELECT
        ar.id,
        ar.attendance_date,
        ar.check_in_time,
        ar.status,
        ar.remarks,
        s.employee_id,
        s.first_name,
        s.last_name,
        s.department
      FROM attendance_records ar
      INNER JOIN staff s ON s.id = ar.staff_id
      WHERE 1 = 1
    `;

    const params = [];

    if (startDate) {
      sql += " AND ar.attendance_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND ar.attendance_date <= ?";
      params.push(endDate);
    }

    if (staffId) {
      sql += " AND ar.staff_id = ?";
      params.push(staffId);
    }

    sql += " ORDER BY ar.attendance_date DESC, ar.check_in_time DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },

  // Task report with optional status filter
  async getTaskReport({ status, startDate, endDate }) {
    let sql = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.start_date,
        t.due_date,
        t.completed_at,
        t.created_at,
        assigned.employee_id AS assigned_employee_id,
        CONCAT(assigned.first_name, ' ', assigned.last_name)
          AS assigned_staff_name,
        CONCAT(creator.first_name, ' ', creator.last_name)
          AS created_by_name
      FROM tasks t
      LEFT JOIN staff assigned ON assigned.id = t.assigned_to
      LEFT JOIN staff creator ON creator.id = t.created_by
      WHERE 1 = 1
    `;

    const params = [];

    if (status) {
      sql += " AND t.status = ?";
      params.push(status);
    }

    if (startDate) {
      sql += " AND DATE(t.created_at) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND DATE(t.created_at) <= ?";
      params.push(endDate);
    }

    sql += " ORDER BY t.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },

  // Asset report
  async getAssetReport({ status, category }) {
    let sql = `
      SELECT
        a.id,
        a.asset_tag,
        a.asset_name,
        a.category,
        a.serial_number,
        a.asset_condition,
        a.status,
        a.purchase_date,
        a.purchase_cost,
        a.location,
        a.created_at,
        s.employee_id,
        CONCAT(s.first_name, ' ', s.last_name)
          AS assigned_staff_name
      FROM assets a
      LEFT JOIN staff s ON s.id = a.assigned_to
      WHERE 1 = 1
    `;

    const params = [];

    if (status) {
      sql += " AND a.status = ?";
      params.push(status);
    }

    if (category) {
      sql += " AND a.category = ?";
      params.push(category);
    }

    sql += " ORDER BY a.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },
};

module.exports = Report;
