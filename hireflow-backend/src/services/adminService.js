'use strict';

const { getPool } = require('../db/pool');
const { HttpError } = require('./authService');

async function listUsers() {
  const pool = getPool();
  const res = await pool.query(
    'SELECT id, email, role, is_active, created_at FROM users ORDER BY id'
  );
  return res.rows;
}

async function deactivateUser(userId) {
  const pool = getPool();
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid user id.');
  }
  const res = await pool.query(
    'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id, email, role, is_active, created_at',
    [id]
  );
  if (res.rows.length === 0) {
    throw new HttpError(404, 'User not found.');
  }
  return res.rows[0];
}

async function getStats() {
  const pool = getPool();
  const res = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM jobs) AS total_jobs,
       (SELECT COUNT(*) FROM applications) AS total_applications,
       (SELECT COUNT(*) FROM jobs WHERE status = 'open') AS open_jobs,
       (SELECT COUNT(*) FROM jobs WHERE status = 'closed') AS closed_jobs`
  );
  const row = res.rows[0];
  return {
    total_users: Number(row.total_users),
    total_jobs: Number(row.total_jobs),
    total_applications: Number(row.total_applications),
    jobs_by_status: { open: Number(row.open_jobs), closed: Number(row.closed_jobs) },
  };
}

module.exports = { listUsers, deactivateUser, getStats };
