const db = require("../config/database");

const Staff = {
    async testConnection() {
        await db.query("SELECT 1");
    },

    async findAll() {
        const [rows] = await db.execute(
            "SELECT * FROM staff ORDER BY id DESC"
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await db.execute(
            "SELECT * FROM staff WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    async create(data) {
        const sql = `
            INSERT INTO staff
            (employee_id, first_name, last_name, email,
             department, position, employment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.employee_id,
            data.first_name,
            data.last_name,
            data.email || null,
            data.department || null,
            data.position || null,
            data.employment_status || "Active"
        ];

        const [result] = await db.execute(sql, values);
        return result.insertId;
    },

    async update(id, data) {
        const sql = `
            UPDATE staff
            SET employee_id = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                department = ?,
                position = ?,
                employment_status = ?
            WHERE id = ?
        `;

        const values = [
            data.employee_id,
            data.first_name,
            data.last_name,
            data.email || null,
            data.department || null,
            data.position || null,
            data.employment_status || "Active",
            id
        ];

        const [result] = await db.execute(sql, values);
        return result.affectedRows;
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
