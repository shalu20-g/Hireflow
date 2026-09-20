'use strict';

const { getPool } = require('../db/pool');
const { HttpError } = require('./authService');

// Recruiter profile id for the authenticated user. Never from client input.
async function getRecruiterId(pool, userId) {
  const res = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) {
    throw new HttpError(403, 'No recruiter profile is associated with this account.');
  }
  return res.rows[0].id;
}

function toCompany(row) {
  return { id: row.id, name: row.name, description: row.description };
}

// Create a company owned by the authenticated recruiter. The client supplies
// only name/description; recruiter_id always comes from the JWT identity.
async function createCompany({ userId, name, description }) {
  if (!name || !String(name).trim()) {
    throw new HttpError(400, 'Company name is required.');
  }
  const pool = getPool();
  const recruiterId = await getRecruiterId(pool, userId);
  const cleanDescription =
    description === undefined || description === null || String(description).trim() === ''
      ? null
      : String(description).trim();
  const res = await pool.query(
    'INSERT INTO companies (recruiter_id, name, description) VALUES ($1, $2, $3) RETURNING id, name, description',
    [recruiterId, String(name).trim(), cleanDescription]
  );
  return toCompany(res.rows[0]);
}

// Companies owned by the authenticated recruiter, for display and for
// explicit company selection when a recruiter owns more than one.
async function listMine({ userId }) {
  const pool = getPool();
  const recruiterId = await getRecruiterId(pool, userId);
  const res = await pool.query(
    'SELECT id, name, description FROM companies WHERE recruiter_id = $1 ORDER BY id',
    [recruiterId]
  );
  return res.rows.map(toCompany);
}

module.exports = { createCompany, listMine };
