'use strict';

const { Router } = require('express');
const { handleRegister, handleLogin } = require('../controllers/authController');

const router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);

module.exports = router;
