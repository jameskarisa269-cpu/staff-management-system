
const db = require("../config/database");

const Asset = {
  async getAll(filters = {}) {
    let sql = `
      SELECT
        a.*,
        CONCAT(s.first_name, ' ', s.last_name) AS assigned_staff_name,
        s.employee_id
      FROM assets a
      LEFT JOIN staff s ON a.assigned_to = s.id
      WHERE 1 = 1
    `;

    const params = [];

    if (filters.status) {
      sql += " AND a.status = ?";
      params.push(filters.status);
    }

    if (filters.condition) {
      sql += " AND a.asset_condition = ?";
      params.push(filters.condition);
    }

    if (filters.assigned_to) {
      sql += " AND a.assigned_to = ?";
      params.push(filters.assigned_to);
    }

    sql += " ORDER BY a.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT
         a.*,
         CONCAT(s.first_name, ' ', s.last_name) AS assigned_staff_name,
         s.employee_id
       FROM assets a
       LEFT JOIN staff s ON a.assigned_to = s.id
       WHERE a.id = ?`,
      [id]
    );

    return rows[0];
  },

  async create(data) {
    const {
      asset_tag,
      asset_name,
      category,
      description,
      serial_number,
      asset_condition,
      status,
      assigned_to,
      purchase_date,
      purchase_cost,
      location
    } = data;

    const [result] = await db.query(
      `INSERT INTO assets (
        asset_tag, asset_name, category, description,
        serial_number, asset_condition, status, assigned_to,
        purchase_date, purchase_cost, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_tag,
        asset_name,
        category || null,
        description || null,
        serial_number || null,
        asset_condition || "Good",
        status || (assigned_to ? "Assigned" : "Available"),
        assigned_to || null,
        purchase_date || null,
        purchase_cost ?? null,
        location || null
      ]
    );

    return result.insertId;
  },

  async update(id, data) {
    const {
      asset_tag,
      asset_name,
      category,
      description,
      serial_number,
      asset_condition,
      status,
      assigned_to,
      purchase_date,
      purchase_cost,
      location
    } = data;

    const [result] = await db.query(
      `UPDATE assets SET
        asset_tag = ?,
        asset_name = ?,
        category = ?,
        description = ?,
        serial_number = ?,
        asset_condition = ?,
        status = ?,
        assigned_to = ?,
        purchase_date = ?,
        purchase_cost = ?,
        location = ?
       WHERE id = ?`,
      [
        asset_tag,
        asset_name,
        category || null,
        description || null,
        serial_number || null,
        asset_condition,
        status,
        assigned_to || null,
        purchase_date || null,
        purchase_cost ?? null,
        location || null,
        id
      ]
    );

    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await db.query(
      "DELETE FROM assets WHERE id = ?",
      [id]
    );

    return result.affectedRows;
  },

  async assign(id, staffId) {
    const [result] = await db.query(
      `UPDATE assets
       SET assigned_to = ?,
           status = 'Assigned'
       WHERE id = ?`,
      [staffId, id]
    );

    return result.affectedRows;
  },

  async returnAsset(id) {
    const [result] = await db.query(
      `UPDATE assets
       SET assigned_to = NULL,
           status = 'Available'
       WHERE id = ?`,
      [id]
    );

    return result.affectedRows;
  }
};

module.exports = Asset;
