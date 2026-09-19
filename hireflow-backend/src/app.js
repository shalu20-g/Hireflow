'use strict';

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./controllers/authController');

const app = express();

app.use(express.json());
// Allow only the local frontend origin (override with FRONTEND_URL).
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); // public + protected job endpoints (see routes/jobRoutes.js)
app.use('/api/applications', applicationRoutes); // candidate + recruiter application endpoints
app.use('/api/admin', adminRoutes); // admin-only (auth + role enforced inside the router)
app.use((_req, res) => res.status(404).json({ message: 'Not found.' }));
app.use(errorHandler);

module.exports = app;
