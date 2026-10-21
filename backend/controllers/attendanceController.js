const Attendance = require("../models/attendanceModel");

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function handleError(res, error, message) {
  const statusCode = error.statusCode || (error.code === "ER_DUP_ENTRY" ? 409 : 500);

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message: statusCode === 409 ? "This attendance record already exists." : (
      statusCode >= 500 ? message : error.message
    ),
  });
}

exports.createSession = async (req, res) => {
  const expiresAt = req.body?.expires_at;
  const expiryTime = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;

  if (!Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
    return res.status(400).json({
      message: "A valid future expires_at date is required.",
    });
  }

  try {
    const session = await Attendance.createSession(new Date(expiryTime));
    return res.status(201).json(session);
  } catch (error) {
    return handleError(res, error, "Failed to create attendance session.");
  }
};

exports.closeSession = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "A valid session ID is required." });
  }

  try {
    const result = await Attendance.closeSession(id);

    if (result === null) {
      return res.status(404).json({ message: "Attendance session not found." });
    }

    return res.status(200).json({ message: "Attendance session closed." });
  } catch (error) {
    return handleError(res, error, "Failed to close attendance session.");
  }
};

exports.checkIn = async (req, res) => {
  const staffId = parseId(req.body?.staff_id);
  const qrToken = typeof req.body?.qr_token === "string"
    ? req.body.qr_token.trim()
    : "";

  if (!staffId || !qrToken) {
    return res.status(400).json({
      message: "A valid staff_id and qr_token are required.",
    });
  }

  try {
    const record = await Attendance.checkIn(staffId, qrToken);
    return res.status(201).json(record);
  } catch (error) {
    return handleError(res, error, "Failed to record attendance.");
  }
};

exports.getAll = async (req, res) => {
  const filters = {};

  if (req.query.staff_id !== undefined) {
    filters.staff_id = parseId(req.query.staff_id);
    if (!filters.staff_id) {
      return res.status(400).json({ message: "A valid staff_id is required." });
    }
  }

  if (req.query.date !== undefined) {
    if (!isValidDate(req.query.date)) {
      return res.status(400).json({
        message: "date must be a valid date in YYYY-MM-DD format.",
      });
    }
    filters.date = req.query.date;
  }

  try {
    const records = await Attendance.getAll(filters);
    return res.status(200).json(records);
  } catch (error) {
    return handleError(res, error, "Failed to retrieve attendance records.");
  }
};

exports.getById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "A valid attendance ID is required." });
  }

  try {
    const record = await Attendance.getById(id);

    if (!record) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    return res.status(200).json(record);
  } catch (error) {
    return handleError(res, error, "Failed to retrieve attendance record.");
  }
};

exports.update = async (req, res) => {
  const id = parseId(req.params.id);
  const { status, remarks } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: "A valid attendance ID is required." });
  }

  if (typeof status !== "string" || !status.trim()) {
    return res.status(400).json({ message: "A non-empty status is required." });
  }

  if (remarks !== undefined && remarks !== null && typeof remarks !== "string") {
    return res.status(400).json({ message: "remarks must be a string or null." });
  }

  try {
    const affectedRows = await Attendance.update(id, {
      status: status.trim(),
      remarks: typeof remarks === "string" ? remarks.trim() || null : null,
    });

    if (!affectedRows && !(await Attendance.getById(id))) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    return res.status(200).json({ message: "Attendance record updated." });
  } catch (error) {
    return handleError(res, error, "Failed to update attendance record.");
  }
};

exports.delete = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "A valid attendance ID is required." });
  }

  try {
    const affectedRows = await Attendance.delete(id);

    if (!affectedRows) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    return res.status(200).json({ message: "Attendance record deleted." });
  } catch (error) {
    return handleError(res, error, "Failed to delete attendance record.");
  }
};