'use strict';

const { getPool } = require('../db/pool');
const { HttpError } = require('./authService');

const TRANSITIONS = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

function parsePositiveInt(raw, label) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${label}.`);
  }
  return id;
}

// Candidate profile id for the authenticated user. Never from client input.
async function getCandidateId(pool, userId) {
  const res = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) {
    throw new HttpError(403, 'No candidate profile is associated with this account.');
  }
  return res.rows[0].id;
}

// Job owned by the authenticated recruiter (via companies.recruiter_id).
// Throws 404 when the job does not exist, 403 when owned by someone else.
async function getOwnedJob(pool, userId, jobId) {
  const id = parsePositiveInt(jobId, 'job id');
  const res = await pool.query(
    `SELECT j.id, j.company_id, j.title, j.status FROM jobs j
     JOIN companies c ON c.id = j.company_id
     JOIN recruiters r ON r.id = c.recruiter_id
     WHERE j.id = $1 AND r.user_id = $2`,
    [id, userId]
  );
  if (res.rows.length > 0) {
    return res.rows[0];
  }
  const exists = await pool.query('SELECT 1 FROM jobs WHERE id = $1', [id]);
  if (exists.rows.length === 0) {
    throw new HttpError(404, 'Job not found.');
  }
  throw new HttpError(403, 'Not authorized to access this job.');
}

async function apply({ userId, job_id }) {
  const pool = getPool();
  const jobId = parsePositiveInt(job_id, 'job_id');
  const job = await pool.query('SELECT id, status FROM jobs WHERE id = $1', [jobId]);
  if (job.rows.length === 0) {
    throw new HttpError(404, 'Job not found.');
  }
  if (job.rows[0].status === 'closed') {
    throw new HttpError(400, 'Cannot apply to a closed job.');
  }
  const candidateId = await getCandidateId(pool, userId);
  try {
    const res = await pool.query(
      `INSERT INTO applications (job_id, candidate_id)
       VALUES ($1, $2) RETURNING id, job_id, candidate_id, status, applied_at`,
      [jobId, candidateId]
    );
    return res.rows[0];
  } catch (err) {
    // UNIQUE(job_id, candidate_id) is the source of truth for duplicates.
    if (err && err.code === '23505') {
      throw new HttpError(409, 'You have already applied to this job.');
    }
    throw err;
  }
}

async function listMine({ userId }) {
  const pool = getPool();
  const candidateId = await getCandidateId(pool, userId);
  const res = await pool.query(
    `SELECT a.id, a.status, a.applied_at,
            j.id AS job_id, j.title AS job_title, j.description AS job_description,
            j.location AS job_location, j.job_type AS job_job_type, j.status AS job_status
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.candidate_id = $1
     ORDER BY a.applied_at DESC, a.id DESC`,
    [candidateId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    status: row.status,
    applied_at: row.applied_at,
    job: {
      id: row.job_id,
      title: row.job_title,
      description: row.job_description,
      location: row.job_location,
      job_type: row.job_job_type,
      status: row.job_status,
    },
  }));
}

async function listApplicants({ userId, jobId }) {
  const pool = getPool();
  const job = await getOwnedJob(pool, userId, jobId);
  const res = await pool.query(
    `SELECT a.id, a.status, a.applied_at,
            c.id AS candidate_id, c.full_name AS candidate_name, c.phone AS candidate_phone,
            u.email AS candidate_email
     FROM applications a
     JOIN candidates c ON c.id = a.candidate_id
     JOIN users u ON u.id = c.user_id
     WHERE a.job_id = $1
     ORDER BY a.applied_at DESC, a.id DESC`,
    [job.id]
  );
  return {
    job: { id: job.id, title: job.title, status: job.status },
    applicants: res.rows.map((row) => ({
      id: row.id,
      status: row.status,
      applied_at: row.applied_at,
      candidate: {
        id: row.candidate_id,
        full_name: row.candidate_name,
        phone: row.candidate_phone,
        email: row.candidate_email,
      },
    })),
  };
}

async function updateStatus({ userId, applicationId, status }) {
  const pool = getPool();
  const id = parsePositiveInt(applicationId, 'application id');
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, status)) {
    throw new HttpError(400, 'Invalid status.');
  }
  const current = await pool.query(
    `SELECT a.id, a.status FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN recruiters r ON r.id = c.recruiter_id
     WHERE a.id = $1 AND r.user_id = $2`,
    [id, userId]
  );
  if (current.rows.length === 0) {
    const exists = await pool.query('SELECT 1 FROM applications WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      throw new HttpError(404, 'Application not found.');
    }
    throw new HttpError(403, 'Not authorized to update this application.');
  }
  const from = current.rows[0].status;
  if (!TRANSITIONS[from].includes(status)) {
    throw new HttpError(400, `Invalid status transition from ${from} to ${status}.`);
  }
  const res = await pool.query(
    `UPDATE applications SET status = $1 WHERE id = $2
     RETURNING id, job_id, candidate_id, status, applied_at`,
    [status, id]
  );
  return res.rows[0];
}

module.exports = { apply, listMine, listApplicants, updateStatus };
