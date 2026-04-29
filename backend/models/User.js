const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth'); // adjust path if needed
const { query } = require('../config/db');

// ─── All routes require authentication ────────────────────────────────────────
router.use(authenticate);

// ─── GET /api/users ── list all users (admin only) ───────────────────────────
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, workspace, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/users/stats (admin only) ───────────────────────────────────────
router.get('/stats', authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );
    res.json({ stats: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, workspace, is_active, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/users/:id/role (admin only) ────────────────────────────────────
router.put('/:id/role', authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'mentor', 'trainee'];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const { rows } = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE /api/users/:id (admin only) ──────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;