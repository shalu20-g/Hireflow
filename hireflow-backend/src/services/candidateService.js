'use strict';

const { getPool } = require('../db/pool');
const { HttpError } = require('./authService');

const PROFILE_SELECT = `
  SELECT c.id, c.user_id, c.full_name, c.phone, c.resume_link, c.created_at,
         u.email, u.role
  FROM candidates c
  JOIN users u ON u.id = c.user_id
  WHERE c.user_id = $1`;

function toProfile(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    phone: row.phone,
    resume_link: row.resume_link,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

// Authenticated candidate's own profile. Identity only from userId (JWT).
async function getMe({ userId }) {
  const pool = getPool();
  const res = await pool.query(PROFILE_SELECT, [userId]);
  if (res.rows.length === 0) {
    throw new HttpError(404, 'Candidate profile not found.');
  }
  return toProfile(res.rows[0]);
}

function normalizeOptionalText(raw, label) {
  if (raw === undefined) return undefined; // omitted -> preserved by COALESCE
  if (raw === null) return null;
  const text = String(raw).trim();
  if (text === '') {
    if (label === 'full_name') {
      throw new HttpError(400, 'Full name must not be empty.');
    }
    return null;
  }
  return text;
}

// Partial update of allowed fields only. Omitted fields retain current values.
// Null/empty-string semantics: omitted or explicit null preserves the value;
// an empty string clears phone/resume_link to NULL (400 for full_name).
// Protected fields (ids, email, role, password, created_at) are never read
// from input and never written.
async function updateMe({ userId, full_name, phone, resume_link }) {
  const pool = getPool();
  const nextName = normalizeOptionalText(full_name, 'full_name');
  const nextPhone = normalizeOptionalText(phone, 'phone');
  const nextResume = normalizeOptionalText(resume_link, 'resume_link');
  if (nextName === undefined && nextPhone === undefined && nextResume === undefined) {
    throw new HttpError(400, 'No valid fields to update. Provide full_name, phone, or resume_link.');
  }
  const idRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  if (idRes.rows.length === 0) {
    throw new HttpError(404, 'Candidate profile not found.');
  }
  await pool.query(
    `UPDATE candidates
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         resume_link = COALESCE($3, resume_link)
     WHERE id = $4`,
    [nextName === undefined ? null : nextName, nextPhone === undefined ? null : nextPhone, nextResume === undefined ? null : nextResume, idRes.rows[0].id]
  );
  const res = await pool.query(PROFILE_SELECT, [userId]);
  return toProfile(res.rows[0]);
}

module.exports = { getMe, updateMe };
