'use strict';

const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const companyController = require('../controllers/companyController');

const router = Router();

router.use(authMiddleware, requireRole('recruiter'));

router.get('/mine', companyController.handleListMine);
router.post('/', companyController.handleCreate);

module.exports = router;
