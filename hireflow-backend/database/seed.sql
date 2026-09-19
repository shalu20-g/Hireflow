-- HireFlow - Applicant Tracking System
-- PostgreSQL seed data (Phase 1)
--
-- TESTING PASSWORD (plaintext for ALL seeded users): HireFlow123!
-- The password_hash values below are bcrypt hashes of "HireFlow123!"
-- (cost factor 10). Never use these accounts outside local development.
--
-- Contents (deterministic IDs):
--   users:       1 admin, 2 recruiters, 3 candidates
--   recruiters:  2 profiles (one per recruiter user)
--   companies:   2 (one per recruiter)
--   candidates:  3 profiles (one per candidate user)
--   jobs:        4 (3 open, 1 closed)
--   applications: 7 covering all six statuses:
--                APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED, HIRED
--
-- Idempotency: every INSERT uses ON CONFLICT (id) DO NOTHING, so this file
-- is non-destructive and safe to run multiple times. Existing rows
-- (including any user-created data) are never modified or deleted.

-- ---------------------------------------------------------------------------
-- users (explicit IDs keep every FK reference below stable)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role) VALUES
    (1, 'admin@hireflow.local',     '$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'admin'),
    (2, 'recruiter1@hireflow.local','$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'recruiter'),
    (3, 'recruiter2@hireflow.local','$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'recruiter'),
    (4, 'candidate1@hireflow.local','$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'candidate'),
    (5, 'candidate2@hireflow.local','$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'candidate'),
    (6, 'candidate3@hireflow.local','$2b$10$qwbCvzziyOmCqex70oI7melKZVbWeZFH1MI7AlQCIKi3V5gx1RT9.', 'candidate')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- recruiters
-- ---------------------------------------------------------------------------
INSERT INTO recruiters (id, user_id, full_name) VALUES
    (1, 2, 'Aarav Sharma'),
    (2, 3, 'Diya Patel')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- companies (one per recruiter)
-- ---------------------------------------------------------------------------
INSERT INTO companies (id, recruiter_id, name, description) VALUES
    (1, 1, 'TechNova Solutions', 'A software consultancy building cloud-native products.'),
    (2, 2, 'GreenLeaf Retail',   'A retail chain focused on sustainable consumer goods.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- candidates
-- ---------------------------------------------------------------------------
INSERT INTO candidates (id, user_id, full_name, phone, resume_link) VALUES
    (1, 4, 'Rohan Verma', '+91-9810010011', 'https://example.com/resumes/rohan-verma.pdf'),
    (2, 5, 'Sneha Iyer',  '+91-9810010012', 'https://example.com/resumes/sneha-iyer.pdf'),
    (3, 6, 'Arjun Nair',  '+91-9810010013', 'https://example.com/resumes/arjun-nair.pdf')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- jobs (job 4 is CLOSED; the rest are OPEN)
-- ---------------------------------------------------------------------------
INSERT INTO jobs (id, company_id, title, description, location, job_type, status) VALUES
    (1, 1, 'Backend Developer',  'Build and maintain REST APIs with Node.js and PostgreSQL.', 'Bengaluru', 'Full-time', 'open'),
    (2, 1, 'Frontend Developer', 'Build responsive UIs with React and TypeScript.',           'Remote',    'Full-time', 'open'),
    (3, 2, 'Store Manager',      'Run day-to-day operations for the flagship Mumbai store.',  'Mumbai',    'Full-time', 'open'),
    (4, 2, 'Data Analyst',       'Closed requisition: sales reporting and dashboards.',       'Delhi',     'Contract',  'closed')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- applications (one row per candidate+job; no duplicates)
-- ---------------------------------------------------------------------------
INSERT INTO applications (id, job_id, candidate_id, status) VALUES
    (1, 1, 1, 'APPLIED'),
    (2, 1, 2, 'SHORTLISTED'),
    (3, 2, 1, 'INTERVIEW'),
    (4, 2, 3, 'REJECTED'),
    (5, 3, 2, 'SELECTED'),
    (6, 3, 3, 'APPLIED'),
    (7, 4, 1, 'HIRED')
ON CONFLICT (id) DO NOTHING;

-- Keep SERIAL sequences in sync with the explicit IDs above.
SELECT setval(pg_get_serial_sequence('users', 'id'),        (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('recruiters', 'id'),   (SELECT MAX(id) FROM recruiters));
SELECT setval(pg_get_serial_sequence('companies', 'id'),    (SELECT MAX(id) FROM companies));
SELECT setval(pg_get_serial_sequence('candidates', 'id'),   (SELECT MAX(id) FROM candidates));
SELECT setval(pg_get_serial_sequence('jobs', 'id'),         (SELECT MAX(id) FROM jobs));
SELECT setval(pg_get_serial_sequence('applications', 'id'), (SELECT MAX(id) FROM applications));
