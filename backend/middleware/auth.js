const crypto = require("crypto");

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 12;

function sign(value) {
  return crypto
    .createHmac("sha256", process.env.AUTH_TOKEN_SECRET)
    .update(value)
    .digest("base64url");
}

function createToken(user) {
  if (!process.env.AUTH_TOKEN_SECRET) {
    throw new Error("AUTH_TOKEN_SECRET is not configured.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function authenticate(req, res, next) {
  const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || !process.env.AUTH_TOKEN_SECRET) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return res.status(401).json({ message: "Your session is invalid." });
  }
  const [payload, signature] = parts;

  const expected = sign(payload);
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ message: "Your session is invalid." });
  }

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !user ||
      !["admin", "staff"].includes(user.role) ||
      !Number.isInteger(user.exp) ||
      user.exp <= Math.floor(Date.now() / 1000) ||
      (user.role === "staff" && !Number.isInteger(user.id))
    ) {
      return res.status(401).json({ message: "Your session has expired." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Your session is invalid." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do that." });
    }
    return next();
  };
}

module.exports = { authenticate, createToken, requireRole };
