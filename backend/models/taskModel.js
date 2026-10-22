
const db = require("../config/database");

const Task = {
  async getAll() {
    const [rows] = await db.query(`
      SELECT
        t.id,
        t.title,
        t.description,
        t.assigned_to,
        t.created_by,
        t.priority,
        t.status,
        DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
        t.completed_at,
        t.created_at,
        t.updated_at,
        CONCAT(a.first_name, ' ', a.last_name) AS assigned_staff_name,
        CONCAT(c.first_name, ' ', c.last_name) AS creator_name
      FROM tasks t
      LEFT JOIN staff a ON t.assigned_to = a.id
      LEFT JOIN staff c ON t.created_by = c.id
      ORDER BY t.created_at DESC
    `);

    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.assigned_to,
         t.created_by,
         t.priority,
         t.status,
         DATE_FORMAT(t.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
         t.completed_at,
         t.created_at,
         t.updated_at,
         CONCAT(a.first_name, ' ', a.last_name) AS assigned_staff_name,
         CONCAT(c.first_name, ' ', c.last_name) AS creator_name
       FROM tasks t
       LEFT JOIN staff a ON t.assigned_to = a.id
       LEFT JOIN staff c ON t.created_by = c.id
       WHERE t.id = ?`,
      [id]
    );

    return rows[0];
  },

  async create(data) {
    const {
      title,
      description,
      assigned_to,
      priority,
      status,
      start_date,
      due_date
    } = data;

    const [result] = await db.query(
      `INSERT INTO tasks
       (title, description, assigned_to,
        priority, status, start_date, due_date, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?,
         CASE WHEN ? = 'Completed' THEN NOW() ELSE NULL END)`,
      [
        title,
        description || null,
        assigned_to || null,
        priority || "Medium",
        status || "Pending",
        start_date || null,
        due_date || null,
        status || "Pending"
      ]
    );

    return result.insertId;
  },

  async update(id, data) {
    const {
      title,
      description,
      assigned_to,
      priority,
      status,
      start_date,
      due_date
    } = data;

    const [result] = await db.query(
      `UPDATE tasks
       SET title = ?,
           description = ?,
           assigned_to = ?,
           priority = ?,
           status = ?,
           start_date = ?,
           due_date = ?,
           completed_at = CASE
             WHEN ? = 'Completed'
               THEN COALESCE(completed_at, NOW())
             ELSE NULL
           END
       WHERE id = ?`,
      [
        title,
        description || null,
        assigned_to || null,
        priority,
        status,
        start_date || null,
        due_date || null,
        status,
        id
      ]
    );

    if (result.affectedRows) {
      return true;
    }

    const [rows] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);
    return rows.length > 0;
  },

  async delete(id) {
    const [result] = await db.query(
      "DELETE FROM tasks WHERE id = ?",
      [id]
    );

    return result.affectedRows;
  }
};

module.exports = Task;
