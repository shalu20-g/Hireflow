'use strict';

const companyService = require('../services/companyService');

async function handleCreate(req, res, next) {
  try {
    const company = await companyService.createCompany({ ...(req.body || {}), userId: req.user.id });
    res.status(201).json({ message: 'Company created successfully.', company });
  } catch (err) {
    next(err);
  }
}

async function handleListMine(req, res, next) {
  try {
    const companies = await companyService.listMine({ userId: req.user.id });
    res.status(200).json({ companies });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleCreate, handleListMine };
