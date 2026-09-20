'use strict';

const candidateService = require('../services/candidateService');

async function handleGetMe(req, res, next) {
  try {
    const candidate = await candidateService.getMe({ userId: req.user.id });
    res.status(200).json({ candidate });
  } catch (err) {
    next(err);
  }
}

async function handlePatchMe(req, res, next) {
  try {
    const candidate = await candidateService.updateMe({ ...(req.body || {}), userId: req.user.id });
    res.status(200).json({ message: 'Profile updated successfully.', candidate });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleGetMe, handlePatchMe };
