const db = require("../config/database");

async function findActiveSenior(staffId) {
  const [rows] = await db.execute(
    `SELECT id, department_id
     FROM staff
     WHERE id = ? AND is_senior = 1 AND employment_status = 'Active'
     LIMIT 1`,
    [staffId],
  );
  return rows[0];
}

exports.getTeam = async (req, res) => {
  try {
    const senior = await findActiveSenior(req.user.id);
    if (!senior) {
      return res.status(403).json({ message: "Only active senior staff can manage team positions." });
    }

    const [staff] = await db.execute(
      `SELECT id, employee_id, first_name, last_name, email, position
       FROM staff
       WHERE department_id = ? AND id <> ? AND is_senior = 0
         AND employment_status = 'Active'
       ORDER BY first_name ASC, last_name ASC`,
      [senior.department_id, senior.id],
    );
    return res.status(200).json({ staff });
  } catch (error) {
    console.error("Team retrieval error:", error);
    return res.status(500).json({ message: "Unable to retrieve your department team." });
  }
};

exports.assignPosition = async (req, res) => {
  const staffId = Number(req.params.id);
  const { position } = req.body || {};
  if (
    !Number.isSafeInteger(staffId) ||
    staffId < 1 ||
    typeof position !== "string" ||
    !position.trim() ||
    position.trim().length > 100
  ) {
    return res.status(400).json({ message: "A valid staff member and position of 1 to 100 characters are required." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [seniorRows] = await connection.execute(
      `SELECT id, department_id
       FROM staff
       WHERE id = ? AND is_senior = 1 AND employment_status = 'Active'
       FOR UPDATE`,
      [req.user.id],
    );
    const senior = seniorRows[0];
    if (!senior) {
      await connection.rollback();
      return res.status(403).json({ message: "Only active senior staff can manage team positions." });
    }

    const [juniorRows] = await connection.execute(
      `SELECT id
       FROM staff
       WHERE id = ? AND department_id = ? AND id <> ?
         AND is_senior = 0 AND employment_status = 'Active'
       FOR UPDATE`,
      [staffId, senior.department_id, senior.id],
    );
    if (!juniorRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Active junior staff member not found in your department." });
    }

    await connection.execute(
      "UPDATE staff SET position = ? WHERE id = ?",
      [position.trim(), staffId],
    );
    await connection.commit();
    return res.status(200).json({ message: "Staff position assigned successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Team position assignment error:", error);
    return res.status(500).json({ message: "Unable to assign the staff position." });
  } finally {
    connection?.release();
  }
};
