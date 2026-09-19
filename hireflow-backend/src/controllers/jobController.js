'use strict';

const jobService = require('../services/jobService');

async function handleCreate(req, res, next) {
  try {
    const job = await jobService.createJob({ ...(req.body || {}), userId: req.user.id });
    res.status(201).json({ message: 'Job created successfully.', job });
  } catch (err) {
    next(err);
  }
}

async function handleUpdate(req, res, next) {
  try {
    const job = await jobService.updateJob({ ...(req.body || {}), userId: req.user.id, jobId: req.params.id });
    res.status(200).json({ message: 'Job updated successfully.', job });
  } catch (err) {
    next(err);
  }
}

async function handleClose(req, res, next) {
  try {
    const job = await jobService.closeJob({ userId: req.user.id, jobId: req.params.id });
    res.status(200).json({ message: 'Job closed successfully.', job });
  } catch (err) {
    next(err);
  }
}

async function handleList(req, res, next) {
  try {
    const jobs = await jobService.listJobs(req.query || {});
    res.status(200).json({ jobs });
  } catch (err) {
    next(err);
  }
}

async function handleGet(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json({ job });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleCreate, handleUpdate, handleClose, handleList, handleGet };
