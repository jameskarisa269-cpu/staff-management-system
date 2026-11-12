const crypto = require("crypto");

async function insertStaffWithGeneratedId(connection, data) {
  const [result] = await connection.execute(
    `INSERT INTO staff
       (employee_id, first_name, last_name, email, department,
        department_id, position, employment_status, password_hash, is_senior)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `T${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      data.first_name,
      data.last_name,
      data.email || null,
      data.department || null,
      data.department_id,
      data.position || null,
      data.employment_status || "Active",
      data.password_hash,
      data.is_senior ? 1 : 0,
    ],
  );

  const employeeId = `EMP-${String(result.insertId).padStart(6, "0")}`;
  try {
    await connection.execute(
      "UPDATE staff SET employee_id = ? WHERE id = ?",
      [employeeId, result.insertId],
    );
    return { id: result.insertId, employee_id: employeeId };
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;

    const fallbackId = `EMP-${result.insertId}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await connection.execute(
      "UPDATE staff SET employee_id = ? WHERE id = ?",
      [fallbackId, result.insertId],
    );
    return { id: result.insertId, employee_id: fallbackId };
  }
}

module.exports = { insertStaffWithGeneratedId };
