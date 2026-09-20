'use strict';

const { getPool } = require('../db/pool');
const { HttpError } = require('./authService');

const JOB_COLUMNS = 'id, company_id, title, description, location, job_type, status, created_at';

function parseJobId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid job id.');
  }
  return id;
}

function validateJobFields({ title, description, location, job_type }) {
  if (!title || !String(title).trim()) {
    throw new HttpError(400, 'Title is required.');
  }
  if (!description || !String(description).trim()) {
    throw new HttpError(400, 'Description is required.');
  }
  if (!location || !String(location).trim()) {
    throw new HttpError(400, 'Location is required.');
  }
  if (!job_type || !String(job_type).trim()) {
    throw new HttpError(400, 'Job type is required.');
  }
}

// Recruiter profile id for the authenticated user. Never from client input.
async function getRecruiterId(pool, userId) {
  const res = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) {
    throw new HttpError(403, 'No recruiter profile is associated with this account.');
  }
  return res.rows[0].id;
}

// Resolve which owned company a job is created under.
// An explicit company_id is accepted only after a DB ownership check;
// otherwise the recruiter must own exactly one company.
async function resolveCompanyId(pool, recruiterId, companyIdRaw) {
  if (companyIdRaw !== undefined && companyIdRaw !== null && companyIdRaw !== '') {
    const companyId = Number(companyIdRaw);
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new HttpError(400, 'Invalid company_id.');
    }
    const owned = await pool.query(
      'SELECT id FROM companies WHERE id = $1 AND recruiter_id = $2',
      [companyId, recruiterId]
    );
    if (owned.rows.length === 0) {
      throw new HttpError(403, 'Not authorized for this company.');
    }
    return owned.rows[0].id;
  }
  const companies = await pool.query(
    'SELECT id FROM companies WHERE recruiter_id = $1 ORDER BY id',
    [recruiterId]
  );
  if (companies.rows.length === 0) {
    throw new HttpError(400, 'No company is associated with this recruiter.');
  }
  if (companies.rows.length > 1) {
    throw new HttpError(400, 'Multiple companies found; specify company_id.');
  }
  return companies.rows[0].id;
}

async function createJob({ userId, title, description, location, job_type, company_id }) {
  validateJobFields({ title, description, location, job_type });
  const pool = getPool();
  const recruiterId = await getRecruiterId(pool, userId);
  const companyId = await resolveCompanyId(pool, recruiterId, company_id);
  const res = await pool.query(
    `INSERT INTO jobs (company_id, title, description, location, job_type, status)
     VALUES ($1, $2, $3, $4, $5, 'open') RETURNING ${JOB_COLUMNS}`,
    [companyId, String(title).trim(), String(description).trim(), String(location).trim(), String(job_type).trim()]
  );
  return res.rows[0];
}

// Shared ownership-guarded update. `setClause`/`params` carry only validated values.
async function updateOwnedJob({ userId, jobId, setClause, params }) {
  const pool = getPool();
  const id = parseJobId(jobId);
  const res = await pool.query(
    `UPDATE jobs SET ${setClause}
     WHERE id = $${params.length + 1}
       AND company_id IN (
         SELECT c.id FROM companies c
         JOIN recruiters r ON r.id = c.recruiter_id
         WHERE r.user_id = $${params.length + 2}
       )
     RETURNING ${JOB_COLUMNS}`,
    [...params, id, userId]
  );
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  const exists = await pool.query('SELECT 1 FROM jobs WHERE id = $1', [id]);
  if (exists.rows.length === 0) {
    throw new HttpError(404, 'Job not found.');
  }
  throw new HttpError(403, 'Not authorized to modify this job.');
}

async function updateJob({ userId, jobId, title, description, location, job_type }) {
  validateJobFields({ title, description, location, job_type });
  return updateOwnedJob({
    userId,
    jobId,
    setClause: 'title = $1, description = $2, location = $3, job_type = $4',
    params: [String(title).trim(), String(description).trim(), String(location).trim(), String(job_type).trim()],
  });
}

async function closeJob({ userId, jobId }) {
  return updateOwnedJob({ userId, jobId, setClause: "status = 'closed'", params: [] });
}

// Partial match wrapper. Values stay parameterized; ILIKE handles case-insensitivity.
function ilikePattern(value) {
  return `%${String(value)}%`;
}

async function listJobs({ title, location, job_type }) {
  const pool = getPool();
  const conditions = ["status = 'open'"];
  const params = [];
  if (title !== undefined && title !== null && String(title) !== '') {
    params.push(ilikePattern(title));
    conditions.push(`title ILIKE $${params.length}`);
  }
  if (location !== undefined && location !== null && String(location) !== '') {
    params.push(ilikePattern(location));
    conditions.push(`location ILIKE $${params.length}`);
  }
  if (job_type !== undefined && job_type !== null && String(job_type) !== '') {
    params.push(String(job_type));
    conditions.push(`job_type = $${params.length}`);
  }
  const res = await pool.query(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE ${conditions.join(' AND ')} ORDER BY id`,
    params
  );
  return res.rows;
}

async function getJobById(jobId) {
  const pool = getPool();
  const id = parseJobId(jobId);
  const res = await pool.query(`SELECT ${JOB_COLUMNS} FROM jobs WHERE id = $1`, [id]);
  if (res.rows.length === 0) {
    throw new HttpError(404, 'Job not found.');
  }
  return res.rows[0];
}

// Jobs owned by the authenticated recruiter, with company context for display.
// Identity comes only from userId (verified JWT); no client-supplied ids.
async function listMine({ userId }) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT j.id, j.company_id, j.title, j.description, j.location, j.job_type,
            j.status, j.created_at, c.name AS company_name
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     JOIN recruiters r ON r.id = c.recruiter_id
     WHERE r.user_id = $1
     ORDER BY j.id`,
    [userId]
  );
  return res.rows;
}

module.exports = { createJob, updateJob, closeJob, listJobs, getJobById, listMine };
