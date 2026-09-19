'use strict';

const express = require('express');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const { errorHandler } = require('./controllers/authController');

const app = express();

app.use(express.json());
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); // public + protected job endpoints (see routes/jobRoutes.js)
app.use((_req, res) => res.status(404).json({ message: 'Not found.' }));
app.use(errorHandler);

module.exports = app;
