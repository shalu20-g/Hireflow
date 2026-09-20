'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const candidateController = require('../controllers/candidateController');

const router = Router();

router.use(authMiddleware, requireRole('candidate'));

router.get('/me', candidateController.handleGetMe);
router.patch('/me', candidateController.handlePatchMe);

module.exports = router;
