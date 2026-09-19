'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const applicationController = require('../controllers/applicationController');

const router = Router();

// Static route first so it can never be shadowed by '/:id/status'.
router.get('/mine', authMiddleware, requireRole('candidate'), applicationController.handleListMine);
router.post('/', authMiddleware, requireRole('candidate'), applicationController.handleApply);
router.patch('/:id/status', authMiddleware, requireRole('recruiter'), applicationController.handleUpdateStatus);

module.exports = router;
