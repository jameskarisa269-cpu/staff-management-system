
const db = require("../config/database");

async function createAssignmentNotification(connection, staffId, title) {
  await connection.query(
    `INSERT INTO notifications (staff_id, title, message, type)
     VALUES (?, ?, ?, 'Task')`,
    [
      staffId,
      "New task assigned",
      `An administrator has assigned you the task: "${title}".`,
    ]
  );
}

const Task = {
  async getAll(staffId = null) {
    const filter = staffId === null ? "" : "WHERE t.assigned_to = ?";
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
      ${filter}
      ORDER BY t.created_at DESC
    `, staffId === null ? [] : [staffId]);

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

  async create(data, createdBy = null) {
    const {
      title,
      description,
      assigned_to,
      priority,
      status,
      start_date,
      due_date
    } = data;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO tasks
         (title, description, assigned_to, created_by,
          priority, status, start_date, due_date, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?,
           CASE WHEN ? = 'Completed' THEN NOW() ELSE NULL END)`,
        [
          title,
          description || null,
          assigned_to || null,
          createdBy,
          priority || "Medium",
          status || "Pending",
          start_date || null,
          due_date || null,
          status || "Pending"
        ]
      );

      if (assigned_to) {
        await createAssignmentNotification(connection, assigned_to, title);
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Failed to roll back task creation:", rollbackError);
      }
      throw error;
    } finally {
      connection.release();
    }
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

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [existingTasks] = await connection.query(
        "SELECT assigned_to FROM tasks WHERE id = ? FOR UPDATE",
        [id]
      );

      if (!existingTasks.length) {
        await connection.rollback();
        return { updated: false, notificationSent: false };
      }

      const currentAssignee = existingTasks[0].assigned_to;
      const notificationSent = Boolean(
        assigned_to && Number(assigned_to) !== Number(currentAssignee)
      );
      await connection.query(
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

      if (notificationSent) {
        await createAssignmentNotification(connection, assigned_to, title);
      }

      await connection.commit();
      return { updated: true, notificationSent };
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Failed to roll back task update:", rollbackError);
      }
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, staffId, status) {
    const [result] = await db.query(
      `UPDATE tasks SET status = ?,
       completed_at = CASE
         WHEN ? = 'Completed' THEN COALESCE(completed_at, NOW())
         ELSE NULL
       END
       WHERE id = ? AND assigned_to = ?`,
      [status, status, id, staffId]
    );
    if (result.affectedRows) return result.affectedRows;

    const [rows] = await db.query(
      "SELECT id FROM tasks WHERE id = ? AND assigned_to = ?",
      [id, staffId]
    );
    return rows.length ? 1 : 0;
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
