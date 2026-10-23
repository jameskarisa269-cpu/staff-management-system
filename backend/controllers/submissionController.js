const db = require("../config/database");

const validId = (value) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

exports.getReports = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.staff_id, r.task_id, r.title, r.content, r.created_at,
              CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
              s.employee_id, COALESCE(d.department_name, s.department) AS department,
              t.title AS task_title
       FROM staff_reports r
       INNER JOIN staff s ON s.id = r.staff_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN tasks t ON t.id = r.task_id
       ${req.user.role === "admin" ? "" : "WHERE r.staff_id = ?"}
       ORDER BY r.created_at DESC`,
      req.user.role === "admin" ? [] : [req.user.id],
    );
    return res.status(200).json({ reports: rows });
  } catch (error) {
    console.error("Get staff reports error:", error);
    return res.status(500).json({ message: "Failed to retrieve staff reports." });
  }
};

exports.createReport = async (req, res) => {
  const { title, content, task_id } = req.body || {};
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 200 ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return res.status(400).json({
      message: "A report title and report details are required.",
    });
  }

  let taskId = null;
  if (task_id !== undefined && task_id !== null && task_id !== "") {
    if (!validId(task_id)) {
      return res.status(400).json({ message: "The selected task is invalid." });
    }
    taskId = Number(task_id);
  }

  try {
    if (taskId !== null) {
      const [tasks] = await db.execute(
        "SELECT id FROM tasks WHERE id = ? AND assigned_to = ?",
        [taskId, req.user.id],
      );
      if (!tasks.length) {
        return res.status(403).json({
          message: "You can only submit a report for a task assigned to you.",
        });
      }
    }

    const [result] = await db.execute(
      "INSERT INTO staff_reports (staff_id, task_id, title, content) VALUES (?, ?, ?, ?)",
      [req.user.id, taskId, title.trim(), content.trim()],
    );
    return res.status(201).json({
      message: "Report sent to the administrator.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create staff report error:", error);
    return res.status(500).json({ message: "Failed to submit the report." });
  }
};

exports.getWeeklyBriefs = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT b.id, b.staff_id, b.department_id, b.week_start, b.work_done,
              b.next_week, b.challenges, b.impact, b.created_at, b.updated_at,
              CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
              s.employee_id, d.department_name
       FROM weekly_briefs b
       INNER JOIN staff s ON s.id = b.staff_id
       LEFT JOIN departments d ON d.id = b.department_id
       ORDER BY b.week_start DESC, b.created_at DESC`,
    );
    return res.status(200).json({ briefs: rows });
  } catch (error) {
    console.error("Get weekly briefs error:", error);
    return res.status(500).json({ message: "Failed to retrieve weekly briefs." });
  }
};

exports.saveWeeklyBrief = async (req, res) => {
  const { week_start, work_done, next_week, challenges, impact } = req.body || {};
  if (
    !validDate(week_start) ||
    [work_done, next_week, challenges, impact].some(
      (value) => typeof value !== "string" || !value.trim(),
    )
  ) {
    return res.status(400).json({
      message: "Week start and all four weekly brief sections are required.",
    });
  }

  try {
    await db.execute(
      `INSERT INTO weekly_briefs
         (staff_id, department_id, week_start, work_done, next_week, challenges, impact)
       SELECT id, department_id, ?, ?, ?, ?, ?
      FROM staff WHERE id = ?
      ON DUPLICATE KEY UPDATE
        department_id = VALUES(department_id),
        work_done = VALUES(work_done),
        next_week = VALUES(next_week),
        challenges = VALUES(challenges),
        impact = VALUES(impact)`,
      [
        week_start,
        work_done.trim(),
        next_week.trim(),
        challenges.trim(),
        impact.trim(),
        req.user.id,
      ],
    );

    return res.status(200).json({ message: "Weekly brief shared with all staff." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You have already submitted a brief for that week.",
      });
    }
    console.error("Save weekly brief error:", error);
    return res.status(500).json({ message: "Failed to submit weekly brief." });
  }
};
