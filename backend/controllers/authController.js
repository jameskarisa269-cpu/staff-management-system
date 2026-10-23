const crypto = require("crypto");
const db = require("../config/database");
const { createToken } = require("../middleware/auth");
const { verifyPassword } = require("../utils/password");

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
                s.department_id, d.department_name
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
