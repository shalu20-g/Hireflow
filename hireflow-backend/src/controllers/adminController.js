'use strict';

const adminService = require('../services/adminService');

async function handleListUsers(_req, res, next) {
  try {
    const users = await adminService.listUsers();
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

async function handleDeactivate(req, res, next) {
  try {
    const user = await adminService.deactivateUser(req.params.id);
    res.status(200).json({ message: 'User deactivated successfully.', user });
  } catch (err) {
    next(err);
  }
}

async function handleStats(_req, res, next) {
  try {
    const stats = await adminService.getStats();
    res.status(200).json({ stats });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleListUsers, handleDeactivate, handleStats };
