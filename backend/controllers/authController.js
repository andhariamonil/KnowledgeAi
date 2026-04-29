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

// POST /api/auth/forgot-password
// Generates a reset token and stores it. In production send via email;
// here we return it in the response so you can wire up any mailer later.
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

    // Store token — make sure you have this column in your DB.
    // Run: ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
    //      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
    await query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [tokenHash, expiresAt, userId]
    );

    // In production: send rawToken via email as a link like:
    // https://yourapp.com/reset-password?token=<rawToken>
    // For development we return it directly so you can test without a mailer.
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
      `UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [hash, rows[0].id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, me, logout, forgotPassword, resetPassword };