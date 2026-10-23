
const Task = require("../models/taskModel");

const allowedPriorities = ["Low", "Medium", "High", "Urgent"];
const allowedStatuses = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled"
];

const validId = (id) =>
  /^\d+$/.test(String(id)) &&
  Number.isSafeInteger(Number(id)) &&
  Number(id) > 0;

function isValidDate(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateTask(body) {
  const input = body && typeof body === "object" ? body : {};
  const {
    title,
    description,
    assigned_to,
    priority = "Medium",
    status = "Pending",
    start_date,
    due_date
  } = input;

  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return { error: "Task title is required and must be at most 200 characters" };
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return { error: "Task description must be a string or null" };
  }

  if (assigned_to !== undefined && assigned_to !== null && assigned_to !== "" && !validId(assigned_to)) {
    return { error: "Assigned staff member must be a valid staff ID" };
  }

  if (!allowedPriorities.includes(priority)) {
    return { error: "Invalid priority" };
  }

  if (!allowedStatuses.includes(status)) {
    return { error: "Invalid task status" };
  }

  if (!isValidDate(start_date) || !isValidDate(due_date)) {
    return { error: "Start and due dates must be valid dates in YYYY-MM-DD format" };
  }

  const normalizedStartDate = start_date || null;
  const normalizedDueDate = due_date || null;
  if (normalizedStartDate && normalizedDueDate && normalizedStartDate > normalizedDueDate) {
    return { error: "Due date cannot be before the start date" };
  }

  return {
    task: {
      title: title.trim(),
      description: description?.trim() || null,
      assigned_to: assigned_to === "" ? null : assigned_to || null,
      priority,
      status,
      start_date: normalizedStartDate,
      due_date: normalizedDueDate
    }
  };
}

const taskController = {
  async getAll(req, res) {
    try {
      const tasks = await Task.getAll(
        req.user.role === "staff" ? req.user.id : null
      );

      return res.status(200).json({
        count: tasks.length,
        tasks
      });
    } catch (error) {
      console.error("Get tasks error:", error);
      return res.status(500).json({
        message: "Failed to retrieve tasks"
      });
    }
  },

  async getById(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await Task.getById(Number(req.params.id));

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (req.user.role === "staff" && task.assigned_to !== req.user.id) {
        return res.status(403).json({ message: "You can only view tasks assigned to you." });
      }

      return res.status(200).json({ task });
    } catch (error) {
      console.error("Get task error:", error);
      return res.status(500).json({
        message: "Failed to retrieve task"
      });
    }
  },

  async create(req, res) {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can assign tasks." });
      }

      const { task, error } = validateTask(req.body);
      if (error) {
        return res.status(400).json({ message: error });
      }

      const id = await Task.create(task, req.user.id);

      return res.status(201).json({
        message: "Task created successfully",
        id
      });
    } catch (error) {
      console.error("Create task error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "Assigned staff member does not exist"
        });
      }

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Duplicate task information"
        });
      }

      return res.status(500).json({
        message: "Failed to create task"
      });
    }
  },

  async update(req, res) {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      if (req.user.role === "staff") {
        const status = req.body?.status;
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ message: "Choose a valid task status." });
        }

        const updated = await Task.updateStatus(
          Number(req.params.id),
          req.user.id,
          status
        );
        if (!updated) {
          const task = await Task.getById(Number(req.params.id));
          return task
            ? res.status(403).json({ message: "You can only update tasks assigned to you." })
            : res.status(404).json({ message: "Task not found" });
        }

        return res.status(200).json({ message: "Task status updated successfully" });
      }

      const { task, error } = validateTask(req.body);
      if (error) {
        return res.status(400).json({ message: error });
      }

      const updated = await Task.update(Number(req.params.id), task);

      if (!updated) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task updated successfully"
      });
    } catch (error) {
      console.error("Update task error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "Assigned staff member does not exist"
        });
      }

      return res.status(500).json({
        message: "Failed to update task"
      });
    }
  },

  async delete(req, res) {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete tasks." });
      }

      if (!validId(req.params.id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const deleted = await Task.delete(Number(req.params.id));

      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json({
        message: "Task deleted successfully"
      });
    } catch (error) {
      console.error("Delete task error:", error);

      return res.status(500).json({
        message: "Failed to delete task"
      });
    }
  }
};

module.exports = taskController;
