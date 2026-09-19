'use strict';

// Reusable role gate. Accepts one role or an array of roles.
// The role is read ONLY from req.user (populated from the verified JWT).
function requireRole(allowed) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden for this role.' });
    }
    return next();
  };
}

module.exports = requireRole;
