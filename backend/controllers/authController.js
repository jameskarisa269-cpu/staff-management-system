const crypto = require("crypto");
const db = require("../config/database");
const { createToken } = require("../middleware/auth");
const { hashPassword, verifyPassword } = require("../utils/password");
const { insertStaffWithGeneratedId } = require("../utils/employeeId");

exports.login = async (req, res) => {
  const { email, password, role } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length > 128 ||
    !["admin", "staff"].includes(role)
  ) {
    return res.status(400).json({ message: "Enter your email, password, and role." });
  }

  try {
    let user;
    if (role === "admin") {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        return res.status(503).json({
          message: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment.",
        });
      }

      const configuredEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
      const suppliedEmail = email.trim().toLowerCase();
      const configuredPassword = Buffer.from(process.env.ADMIN_PASSWORD);
      const suppliedPassword = Buffer.from(password);
      const emailMatches = suppliedEmail === configuredEmail;
      const passwordMatches =
        suppliedPassword.length === configuredPassword.length &&
        crypto.timingSafeEqual(suppliedPassword, configuredPassword);

      if (emailMatches && passwordMatches) {
        user = { id: null, role: "admin", name: "Administrator", email: configuredEmail };
      }
    } else {
      const [rows] = await db.execute(
        `SELECT s.id, s.first_name, s.last_name, s.email, s.employee_id,
                s.password_hash,
                s.department_id, d.department_name, s.is_senior
         FROM staff s
         LEFT JOIN departments d ON d.id = s.department_id
         WHERE LOWER(s.email) = LOWER(?)
           AND s.employment_status = 'Active'
         LIMIT 1`,
        [email.trim()],
      );

      if (rows[0] && (await verifyPassword(password, rows[0].password_hash))) {
        const staff = rows[0];
        user = {
          id: staff.id,
          role: "staff",
          name: `${staff.first_name} ${staff.last_name}`.trim(),
          email: staff.email,
          employee_id: staff.employee_id,
          department_id: staff.department_id,
          department: staff.department_name,
          is_senior: Boolean(staff.is_senior),
        };
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    if (!process.env.AUTH_TOKEN_SECRET) {
      return res.status(503).json({
        message: "Authentication is not configured. Set AUTH_TOKEN_SECRET in the backend environment.",
      });
    }

    return res.status(200).json({ token: createToken(user), user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to sign in." });
  }
};

exports.getConfig = (req, res) => {
  res.status(200).json({
    adminConfigured: Boolean(
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      process.env.AUTH_TOKEN_SECRET,
    ),
  });
};

exports.createAccountRequest = async (req, res) => {
  const { first_name, last_name, email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    typeof first_name !== "string" ||
    !first_name.trim() ||
    first_name.trim().length > 100 ||
    typeof last_name !== "string" ||
    !last_name.trim() ||
    last_name.trim().length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    return res.status(400).json({
      message: "Enter your first and last name, a valid email, and a password of 8 to 128 characters.",
    });
  }

  try {
    const [existingStaff] = await db.execute(
      "SELECT id FROM staff WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [normalizedEmail],
    );
    if (existingStaff.length) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const [existingRequest] = await db.execute(
      "SELECT id, status FROM staff_account_requests WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );
    if (existingRequest[0]?.status === "pending") {
      return res.status(409).json({
        message: "An account request for that email is already awaiting admin approval.",
      });
    }

    if (existingRequest[0]) {
      await db.execute(
        `UPDATE staff_account_requests
         SET first_name = ?, last_name = ?, password_hash = ?,
             status = 'pending', staff_id = NULL, reviewed_at = NULL
         WHERE id = ?`,
        [first_name.trim(), last_name.trim(), passwordHash, existingRequest[0].id],
      );
    } else {
      await db.execute(
        `INSERT INTO staff_account_requests
           (first_name, last_name, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [first_name.trim(), last_name.trim(), normalizedEmail, passwordHash],
      );
    }

    return res.status(201).json({
      message: "Your account request was sent to the administrator. You can sign in after it is approved.",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An account request for that email is already awaiting admin approval.",
      });
    }
    console.error("Account request error:", error);
    return res.status(500).json({ message: "Unable to submit your account request." });
  }
};

exports.getAccountRequests = async (_req, res) => {
  try {
    const [requests] = await db.execute(
      `SELECT id, first_name, last_name, email, created_at
       FROM staff_account_requests
       WHERE status = 'pending'
       ORDER BY created_at ASC`,
    );
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Account request retrieval error:", error);
    return res.status(500).json({ message: "Unable to retrieve account requests." });
  }
};

exports.approveAccountRequest = async (req, res) => {
  const requestId = Number(req.params.id);
  const { department_id, position, is_senior } = req.body || {};
  const parsedDepartmentId = Number(department_id);

  if (
    !Number.isSafeInteger(requestId) ||
    requestId < 1 ||
    !Number.isSafeInteger(parsedDepartmentId) ||
    parsedDepartmentId < 1 ||
    (position !== undefined && position !== null && typeof position !== "string") ||
    (typeof position === "string" && position.trim().length > 100) ||
    (is_senior !== undefined && typeof is_senior !== "boolean")
  ) {
    return res.status(400).json({
      message: "A valid department is required. Position must be 100 characters or fewer, and senior access must be true or false.",
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.execute(
      `SELECT id, first_name, last_name, email, password_hash, status
       FROM staff_account_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId],
    );
    const accountRequest = requests[0];
    if (!accountRequest) {
      await connection.rollback();
      return res.status(404).json({ message: "Account request not found." });
    }
    if (accountRequest.status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ message: "This account request has already been reviewed." });
    }

    const [departments] = await connection.execute(
      "SELECT id, department_name FROM departments WHERE id = ? AND status = 'Active'",
      [parsedDepartmentId],
    );
    if (!departments[0]) {
      await connection.rollback();
      return res.status(400).json({ message: "Select an active department." });
    }

    const [existingStaff] = await connection.execute(
      "SELECT id FROM staff WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [accountRequest.email],
    );
    if (existingStaff.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "That email is already assigned to a staff account.",
      });
    }

    const staff = await insertStaffWithGeneratedId(connection, {
      first_name: accountRequest.first_name,
      last_name: accountRequest.last_name,
      email: accountRequest.email,
      department: departments[0].department_name,
      department_id: parsedDepartmentId,
      position: typeof position === "string" ? position.trim() || null : null,
      password_hash: accountRequest.password_hash,
      is_senior: Boolean(is_senior),
    });

    await connection.execute(
      `UPDATE staff_account_requests
       SET status = 'approved', staff_id = ?, password_hash = NULL, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [staff.id, requestId],
    );
    await connection.commit();
    return res.status(200).json({
      message: "Account request approved and staff account created.",
      employee_id: staff.employee_id,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That email is already assigned to a staff account.",
      });
    }
    console.error("Account request approval error:", error);
    return res.status(500).json({ message: "Unable to approve the account request." });
  } finally {
    connection?.release();
  }
};

exports.rejectAccountRequest = async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isSafeInteger(requestId) || requestId < 1) {
    return res.status(400).json({ message: "A valid account request ID is required." });
  }

  try {
    const [result] = await db.execute(
      `UPDATE staff_account_requests
       SET status = 'rejected', password_hash = NULL, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [requestId],
    );
    if (!result.affectedRows) {
      const [requests] = await db.execute(
        "SELECT id FROM staff_account_requests WHERE id = ?",
        [requestId],
      );
      if (!requests.length) {
        return res.status(404).json({ message: "Account request not found." });
      }
      return res.status(409).json({ message: "This account request has already been reviewed." });
    }
    return res.status(200).json({ message: "Account request rejected." });
  } catch (error) {
    console.error("Account request rejection error:", error);
    return res.status(500).json({ message: "Unable to reject the account request." });
  }
};
