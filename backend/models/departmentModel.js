const db = require("../config/database");

const departmentSelect = `
    SELECT
        d.id,
        d.department_name,
        d.description,
        d.manager_id,
        d.status,
        CONCAT(s.first_name, ' ', s.last_name) AS manager_name
    FROM departments d
    LEFT JOIN staff s ON s.id = d.manager_id
`;

const Department = {
    async findAll() {
        const [rows] = await db.execute(
            `${departmentSelect} ORDER BY d.department_name ASC`
        );
        return rows;
    },

    async findById(id) {
        const [rows] = await db.execute(
            `${departmentSelect} WHERE d.id = ?`,
            [id]
        );
        return rows[0];
    },

    async managerExists(managerId) {
        const [rows] = await db.execute(
            "SELECT id FROM staff WHERE id = ?",
            [managerId]
        );
        return rows.length > 0;
    },

    async create(data) {
        const [result] = await db.execute(
            `INSERT INTO departments
                (department_name, description, manager_id, status)
             VALUES (?, ?, ?, ?)`,
            [
                data.department_name,
                data.description,
                data.manager_id,
                data.status
            ]
        );
        return result.insertId;
    },

    async update(id, data) {
        const [result] = await db.execute(
            `UPDATE departments
             SET department_name = ?,
                 description = ?,
                 manager_id = ?,
                 status = ?
             WHERE id = ?`,
            [
                data.department_name,
                data.description,
                data.manager_id,
                data.status,
                id
            ]
        );
        return result.affectedRows;
    },

    async delete(id) {
        const [result] = await db.execute(
            "DELETE FROM departments WHERE id = ?",
            [id]
        );
        return result.affectedRows;
    }
};

module.exports = Department;