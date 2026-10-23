const Staff = require("../models/staffModel");
const Department = require("../models/departmentModel");
const { hashPassword } = require("../utils/password");

function validateDepartmentId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function departmentForStaff(value) {
    const departmentId = validateDepartmentId(value);
    if (!departmentId) return null;

    const department = await Department.findById(departmentId);
    if (!department) return null;
    return department;
}

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.findAll();
        res.status(200).json(staff);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to retrieve staff." });
    }
};

exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: "Staff not found." });
        }

        res.status(200).json(staff);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to retrieve staff." });
    }
};

exports.createStaff = async (req, res) => {
    const {
        employee_id,
        first_name,
        last_name,
        email,
        department_id,
        position,
        employment_status,
        password
    } = req.body || {};

    if (
        typeof employee_id !== "string" ||
        !employee_id.trim() ||
        typeof first_name !== "string" ||
        !first_name.trim() ||
        typeof last_name !== "string" ||
        !last_name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
    ) {
        return res.status(400).json({
            message: "Employee ID, first name, last name, email, department, and a password of 8 to 128 characters are required."
        });
    }

    if (
        employment_status &&
        !["Active", "Inactive"].includes(employment_status)
    ) {
        return res.status(400).json({
            message: "Employment status must be Active or Inactive."
        });
    }

    try {
        const department = await departmentForStaff(department_id);
        if (!department) {
            return res.status(400).json({ message: "Select a registered department." });
        }

        const id = await Staff.create({
            employee_id: employee_id.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
            department: department.department_name,
            department_id: department.id,
            position,
            employment_status,
            password_hash: await hashPassword(password)
        });

        res.status(201).json({
            message: "Staff registered successfully.",
            id
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Employee ID or email already exists."
            });
        }

        console.error(error.message);
        res.status(500).json({ message: "Failed to register staff." });
    }
};

exports.updateStaff = async (req, res) => {
    const {
        employee_id,
        first_name,
        last_name,
        email,
        department_id,
        position,
        employment_status,
        password
    } = req.body || {};

    if (
        typeof employee_id !== "string" ||
        !employee_id.trim() ||
        typeof first_name !== "string" ||
        !first_name.trim() ||
        typeof last_name !== "string" ||
        !last_name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        (password !== undefined &&
            password !== "" &&
            (typeof password !== "string" || password.length < 8 || password.length > 128))
    ) {
        return res.status(400).json({
            message: "Employee ID, first name, last name, and email are required. A new password must be 8 to 128 characters."
        });
    }

    if (
        employment_status &&
        !["Active", "Inactive"].includes(employment_status)
    ) {
        return res.status(400).json({
            message: "Employment status must be Active or Inactive."
        });
    }

    try {
        const department = await departmentForStaff(department_id);
        if (!department) {
            return res.status(400).json({ message: "Select a registered department." });
        }

        const affectedRows = await Staff.update(req.params.id, {
            employee_id: employee_id.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
            department: department.department_name,
            department_id: department.id,
            position,
            employment_status,
            password_hash: password ? await hashPassword(password) : null
        });

        if (!affectedRows) {
            return res.status(404).json({ message: "Staff not found." });
        }

        res.status(200).json({ message: "Staff updated successfully." });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Employee ID or email already exists."
            });
        }

        console.error(error.message);
        res.status(500).json({ message: "Failed to update staff." });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const affectedRows = await Staff.delete(req.params.id);

        if (!affectedRows) {
            return res.status(404).json({ message: "Staff not found." });
        }

        res.status(200).json({ message: "Staff deleted successfully." });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Failed to delete staff." });
    }
};
