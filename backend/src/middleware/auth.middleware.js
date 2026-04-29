const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// ── Verify JWT ─────────────────────────────────────────────────────────────────
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch fresh user from DB (so revoked users are rejected)
    const { rows } = await query(
      'SELECT id, name, email, role, workspace, preferences, is_active FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ── Role Guard ─────────────────────────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

const isAdmin   = requireRole('admin');
const isMentor  = requireRole('admin', 'mentor');
const isTrainee = requireRole('admin', 'mentor', 'trainee');

module.exports = { authenticate, requireRole, isAdmin, isMentor, isTrainee };