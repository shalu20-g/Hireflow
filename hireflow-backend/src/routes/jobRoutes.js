'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const jobController = require('../controllers/jobController');
const applicationController = require('../controllers/applicationController');

const router = Router();

// Static/public collection route first so it can never be shadowed by '/:id'.
router.get('/', jobController.handleList); // PUBLIC: open jobs only
router.get('/mine', authMiddleware, requireRole('recruiter'), jobController.handleListMine);
router.get('/:id/applicants', authMiddleware, requireRole('recruiter'), applicationController.handleListApplicants);
router.get('/:id', authMiddleware, jobController.handleGet); // any authenticated role
router.post('/', authMiddleware, requireRole('recruiter'), jobController.handleCreate);
router.put('/:id', authMiddleware, requireRole('recruiter'), jobController.handleUpdate);
router.patch('/:id/close', authMiddleware, requireRole('recruiter'), jobController.handleClose);

module.exports = router;
