'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/pool');

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_REGISTER_ROLES = ['candidate', 'recruiter'];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateRegisterInput({ email, password, role, full_name }) {
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    throw new HttpError(400, 'A valid email is required.');
  }
  if (!password || String(password).length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long.');
  }
  if (!ALLOWED_REGISTER_ROLES.includes(role)) {
    throw new HttpError(400, "Role must be either 'candidate' or 'recruiter'.");
  }
  if (!full_name || !String(full_name).trim()) {
    throw new HttpError(400, 'Full name is required.');
  }
}

async function register({ email, password, role, full_name }) {
  validateRegisterInput({ email, password, role, full_name });

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(full_name).trim();
  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [cleanEmail, passwordHash, role]
    );
    const user = userRes.rows[0];

    if (role === 'candidate') {
      await client.query('INSERT INTO candidates (user_id, full_name) VALUES ($1, $2)', [
        user.id,
        cleanName,
      ]);
    } else {
      await client.query('INSERT INTO recruiters (user_id, full_name) VALUES ($1, $2)', [
        user.id,
        cleanName,
      ]);
    }
    await client.query('COMMIT');
    return { id: user.id, email: user.email, role: user.role, full_name: cleanName };
  } catch (err) {
    await client.query('ROLLBACK');
    // Unique violation on users.email -> email already taken (not a 500).
    if (err && err.code === '23505') {
      throw new HttpError(409, 'Email already exists.');
    }
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const pool = getPool();
  const res = await pool.query('SELECT id, email, password_hash, role, is_active FROM users WHERE LOWER(email) = $1', [
    String(email).trim().toLowerCase(),
  ]);
  const user = res.rows[0];

  // Same generic message whether the email is unknown or the password is wrong.
  const ok = user ? await bcrypt.compare(String(password), user.password_hash) : false;
  if (!ok) {
    throw new HttpError(401, 'invalid credentials.');
  }
  if (user.is_active === false) {
    throw new HttpError(403, 'This account has been deactivated.');
  }

  if (!process.env.JWT_SECRET) {
    throw new HttpError(500, 'Server is missing JWT configuration.');
  }
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

module.exports = { register, login, HttpError };
