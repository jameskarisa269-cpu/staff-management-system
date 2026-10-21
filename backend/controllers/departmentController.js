const Department = require("../models/departmentModel");

function parseId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateDepartment(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "A department object is required." };
    }

    if (
        typeof body.department_name !== "string" ||
        !body.department_name.trim()
    ) {
        return { error: "Department name is required." };
    }

    if (body.department_name.trim().length > 100) {
        return { error: "Department name must be 100 characters or fewer." };
    }

    if (
        body.description !== undefined &&
        body.description !== null &&
        typeof body.description !== "string"
    ) {
        return { error: "Description must be a string or null." };
    }

    if (
        body.status !== undefined &&
        !["Active", "Inactive"].includes(body.status)
    ) {
        return { error: "Status must be Active or Inactive." };
    }

    let managerId = null;
    if (body.manager_id !== undefined && body.manager_id !== null && body.manager_id !== "") {
        managerId = parseId(body.manager_id);
        if (!managerId) {
            return { error: "Manager must be a valid staff ID." };
        }
    }

    return {
        data: {
            department_name: body.department_name.trim(),
            description:
                typeof body.description === "string"
                    ? body.description.trim() || null
                    : null,
            manager_id: managerId,
            status: body.status || "Active"
        }
    };
}

function handleError(res, error, message) {
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "A department with that name already exists."
        });
    }

    console.error(error);
    return res.status(500).json({ message });
}

exports.getAll = async (req, res) => {
    try {
        const departments = await Department.findAll();
        return res.status(200).json(departments);
    } catch (error) {
        return handleError(res, error, "Failed to retrieve departments.");
    }
};

exports.getById = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "A valid department ID is required." });
    }

    try {
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ message: "Department not found." });
        }
        return res.status(200).json(department);
    } catch (error) {
        return handleError(res, error, "Failed to retrieve department.");
    }
};

exports.create = async (req, res) => {
    const validation = validateDepartment(req.body);
    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

    try {
        if (
            validation.data.manager_id &&
            !(await Department.managerExists(validation.data.manager_id))
        ) {
            return res.status(400).json({ message: "Selected manager was not found." });
        }

        const id = await Department.create(validation.data);
        return res.status(201).json({
            message: "Department created successfully.",
            id
        });
    } catch (error) {
        return handleError(res, error, "Failed to create department.");
    }
};

exports.update = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "A valid department ID is required." });
    }

    const validation = validateDepartment(req.body);
    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

    try {
        if (
            validation.data.manager_id &&
            !(await Department.managerExists(validation.data.manager_id))
        ) {
            return res.status(400).json({ message: "Selected manager was not found." });
        }

        const affectedRows = await Department.update(id, validation.data);
        if (!affectedRows && !(await Department.findById(id))) {
            return res.status(404).json({ message: "Department not found." });
        }

        return res.status(200).json({ message: "Department updated successfully." });
    } catch (error) {
        return handleError(res, error, "Failed to update department.");
    }
};

exports.delete = async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "A valid department ID is required." });
    }

    try {
        const affectedRows = await Department.delete(id);
        if (!affectedRows) {
            return res.status(404).json({ message: "Department not found." });
        }
        return res.status(200).json({ message: "Department deleted successfully." });
    } catch (error) {
        return handleError(res, error, "Failed to delete department.");
    }
};