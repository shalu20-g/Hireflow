'use strict';

const applicationService = require('../services/applicationService');

async function handleApply(req, res, next) {
  try {
    const application = await applicationService.apply({ ...(req.body || {}), userId: req.user.id });
    res.status(201).json({ message: 'Application submitted successfully.', application });
  } catch (err) {
    next(err);
  }
}

async function handleListMine(req, res, next) {
  try {
    const applications = await applicationService.listMine({ userId: req.user.id });
    res.status(200).json({ applications });
  } catch (err) {
    next(err);
  }
}

async function handleListApplicants(req, res, next) {
  try {
    const result = await applicationService.listApplicants({ userId: req.user.id, jobId: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function handleUpdateStatus(req, res, next) {
  try {
    const application = await applicationService.updateStatus({
      ...(req.body || {}),
      userId: req.user.id,
      applicationId: req.params.id,
    });
    res.status(200).json({ message: 'Application status updated successfully.', application });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleApply, handleListMine, handleListApplicants, handleUpdateStatus };
