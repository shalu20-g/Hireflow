'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const adminController = require('../controllers/adminController');

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/users', adminController.handleListUsers);
router.patch('/users/:id/deactivate', adminController.handleDeactivate);
router.get('/stats', adminController.handleStats);

module.exports = router;
