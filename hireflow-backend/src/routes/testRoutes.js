'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');

// TEMPORARY Phase 4 verification routes. Not part of the product API.
const router = Router();

router.use(authMiddleware);

router.get('/candidate-only', requireRole('candidate'), (_req, res) =>
  res.status(200).json({ message: 'Candidate access granted.' })
);

router.get('/recruiter-only', requireRole('recruiter'), (_req, res) =>
  res.status(200).json({ message: 'Recruiter access granted.' })
);

router.get('/admin-only', requireRole('admin'), (_req, res) =>
  res.status(200).json({ message: 'Admin access granted.' })
);

module.exports = router;
