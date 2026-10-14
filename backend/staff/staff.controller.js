
const Staff = require("./staff.model");

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
        department,
        position,
        employment_status
    } = req.body;

    if (
        !employee_id?.trim() ||
        !first_name?.trim() ||
        !last_name?.trim()
    ) {
        return res.status(400).json({
            message: "Employee ID, first name and last name are required."
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
        const id = await Staff.create({
            employee_id: employee_id.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email,
            department,
            position,
            employment_status
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
        department,
        position,
        employment_status
    } = req.body;

    if (
        !employee_id?.trim() ||
        !first_name?.trim() ||
        !last_name?.trim()
    ) {
        return res.status(400).json({
            message: "Employee ID, first name and last name are required."
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
        const affectedRows = await Staff.update(req.params.id, {
            employee_id: employee_id.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email,
            department,
            position,
            employment_status
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
