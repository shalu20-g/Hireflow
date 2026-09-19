'use strict';

const { register, login, HttpError } = require('../services/authService');

async function handleRegister(req, res, next) {
  try {
    const user = await register(req.body || {});
    res.status(201).json({ message: 'Registered successfully.', user });
  } catch (err) {
    next(err);
  }
}

async function handleLogin(req, res, next) {
  try {
    const { token, user } = await login(req.body || {});
    res.status(200).json({ message: 'Login successful.', token, user });
  } catch (err) {
    next(err);
  }
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  // Safety net: a raced duplicate email surfacing outside the service maps to 409.
  if (err && err.code === '23505') {
    return res.status(409).json({ message: 'Email already exists.' });
  }
  if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error.' });
}

module.exports = { handleRegister, handleLogin, errorHandler };
