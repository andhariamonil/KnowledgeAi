const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

function normalisePreferences(input = {}) {
  const allowedModes = ['hybrid', 'semantic', 'keyword'];
  const ragMode = allowedModes.includes(input.ragMode) ? input.ragMode : 'hybrid';
  const parsedResultCount = parseInt(input.resultCount, 10);
  const resultCount = Number.isFinite(parsedResultCount) ? Math.min(Math.max(parsedResultCount, 1), 10) : 5;
  return { ragMode, resultCount };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role = 'trainee', workspace } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const validRoles = ['admin', 'mentor', 'trainee'];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, workspace)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), email.toLowerCase(), hash, role, workspace?.trim() || null]
    );

    const user  = rows[0];
    const token = signToken(user.id);

    res.status(201).json({ user: safeUser(user), token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.is_active)
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

    const token = signToken(user.id);
    res.json({ user: safeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

// POST /api/auth/logout  (stateless — client drops token)
async function logout(req, res) {
  res.json({ message: 'Logged out' });
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  try {
    const name = req.body.name?.trim();
    const workspace = req.body.workspace?.trim() || null;

    if (!name) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    const { rows } = await query(
      `UPDATE users
       SET name = $1, workspace = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, workspace, preferences, is_active, created_at, updated_at`,
      [name, workspace, req.user.id]
    );

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

// PUT /api/auth/password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to update password' });
  }
}

// GET /api/auth/preferences
async function getPreferences(req, res) {
  res.json({ preferences: normalisePreferences(req.user.preferences || {}) });
}

// PUT /api/auth/preferences
async function updatePreferences(req, res) {
  try {
    const preferences = normalisePreferences(req.body || {});
    const { rows } = await query(
      `UPDATE users
       SET preferences = $1::jsonb, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, workspace, preferences, is_active, created_at, updated_at`,
      [JSON.stringify(preferences), req.user.id]
    );
    res.json({ user: rows[0], preferences });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ message: 'Failed to save preferences' });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email is required' });

    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always respond with success to prevent email enumeration
    if (rows.length === 0)
      return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const userId = rows[0].id;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [tokenHash, expiresAt, userId]
    );

    // In production: send rawToken via email
    // In dev: return it directly so you can test without a mailer
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      message: 'If that email exists, a reset link has been sent.',
      ...(isDev && { resetToken: rawToken, note: 'Token returned in dev mode only' }),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(newPassword, 12);
    await query(
      `UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2`,
      [hash, rows[0].id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  forgotPassword,
  resetPassword,
};