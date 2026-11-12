const db = require("../config/database");
const { insertStaffWithGeneratedId } = require("../utils/employeeId");

const Staff = {
    async testConnection() {
        await db.query("SELECT 1");
    },

    async findAll() {
        const [rows] = await db.execute(
            `SELECT s.id, s.employee_id, s.first_name, s.last_name, s.email,
                    COALESCE(d.department_name, s.department) AS department,
                    s.department_id, d.department_name,
                    s.position, s.employment_status, s.is_senior, s.created_at
             FROM staff s
             LEFT JOIN departments d ON d.id = s.department_id
             ORDER BY s.id DESC`
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await db.execute(
            `SELECT s.id, s.employee_id, s.first_name, s.last_name, s.email,
                    COALESCE(d.department_name, s.department) AS department,
                    s.department_id, d.department_name,
                    s.position, s.employment_status, s.is_senior, s.created_at
             FROM staff s
             LEFT JOIN departments d ON d.id = s.department_id
             WHERE s.id = ?`,
            [id]
        );
        return rows[0];
    },

    async create(data) {
        const connection = await db.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
            const staff = await insertStaffWithGeneratedId(connection, data);
            await connection.commit();
            return staff;
        } catch (error) {
            if (transactionStarted) await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async update(id, data) {
        const sql = `
            UPDATE staff
            SET employee_id = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                department = ?,
                department_id = ?,
                position = ?,
                employment_status = ?${data.password_hash ? ", password_hash = ?" : ""}${data.is_senior !== undefined ? ", is_senior = ?" : ""}
            WHERE id = ?
        `;

        const values = [
            data.employee_id,
            data.first_name,
            data.last_name,
            data.email || null,
            data.department || null,
            data.department_id,
            data.position || null,
            data.employment_status || "Active",
            ...(data.password_hash ? [data.password_hash] : []),
            ...(data.is_senior !== undefined ? [data.is_senior ? 1 : 0] : []),
            id,
        ];

        const [result] = await db.execute(sql, values);
        if (result.affectedRows) return result.affectedRows;

        const [rows] = await db.execute("SELECT id FROM staff WHERE id = ?", [id]);
        return rows.length ? 1 : 0;
    },

    async delete(id) {
        const [result] = await db.execute(
            "DELETE FROM staff WHERE id = ?",
            [id]
        );
        return result.affectedRows;
    }
};

module.exports = Staff;
