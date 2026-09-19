-- HireFlow - Applicant Tracking System
-- PostgreSQL schema (Phase 1)
-- Tables: users, candidates, recruiters, companies, jobs, applications

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL
                  CHECK (role IN ('candidate', 'recruiter', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- candidates (one profile per user; removed together with the user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL UNIQUE
                REFERENCES users (id) ON DELETE CASCADE,
    full_name   VARCHAR(255) NOT NULL,
    phone       VARCHAR(50),
    resume_link TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- recruiters (one profile per user; removed together with the user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recruiters (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL UNIQUE
               REFERENCES users (id) ON DELETE CASCADE,
    full_name  VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- companies
-- A company owns jobs (and indirectly applications), so deleting a recruiter
-- that still owns a company is RESTRICTed to avoid orphaning critical data.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id           SERIAL PRIMARY KEY,
    recruiter_id INTEGER NOT NULL
                 REFERENCES recruiters (id) ON DELETE RESTRICT,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- jobs
-- Jobs belong to a company; removing the company removes its jobs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id          SERIAL PRIMARY KEY,
    company_id  INTEGER NOT NULL
                REFERENCES companies (id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    location    VARCHAR(100),
    job_type    VARCHAR(50),
    status      VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- applications
-- An application belongs to exactly one job + one candidate.
-- Removing either parent removes the application.
-- UNIQUE(job_id, candidate_id) prevents duplicate applications.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id           SERIAL PRIMARY KEY,
    job_id       INTEGER NOT NULL
                 REFERENCES jobs (id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL
                 REFERENCES candidates (id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
                 CHECK (status IN ('APPLIED', 'SHORTLISTED', 'INTERVIEW',
                                   'SELECTED', 'REJECTED', 'HIRED')),
    applied_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_applications_job_candidate UNIQUE (job_id, candidate_id)
);

-- ---------------------------------------------------------------------------
-- Required indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_job_id
    ON applications (job_id);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id
    ON applications (candidate_id);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id
    ON jobs (company_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status
    ON jobs (status);
