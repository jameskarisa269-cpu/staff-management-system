const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (
    !/^[a-f0-9]{32}$/i.test(salt || "") ||
    !/^[a-f0-9]{128}$/i.test(hash || "")
  ) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

module.exports = { hashPassword, verifyPassword };
