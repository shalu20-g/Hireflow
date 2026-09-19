'use strict';

const jwt = require('jsonwebtoken');

// Verifies `Authorization: Bearer <token>` and attaches the JWT identity.
// Success: req.user = { id, role }; role always comes from the verified token.
function authMiddleware(req, res, next) {
  const header = req.headers && req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Authorization header is required.' });
  }
  const parts = String(header).split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({ message: 'Authorization header must be: Bearer <token>.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server is missing JWT configuration.' });
  }
  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = authMiddleware;
