const { query } = require('../config/db');

// GET /api/users  (admin only)
async function listUsers(req, res) {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, workspace, is_active, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

// GET /api/users/stats
async function getUserStats(req, res) {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'admin')   AS admins,
        COUNT(*) FILTER (WHERE role = 'mentor')  AS mentors,
        COUNT(*) FILTER (WHERE role = 'trainee') AS trainees,
        COUNT(*) AS total
      FROM users WHERE is_active = true
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

// GET /api/users/:id
async function getUserById(req, res) {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, workspace, is_active, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

// PUT /api/users/:id/role  (admin only)
async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'mentor', 'trainee'];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const { rows } = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role`,
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
  }
}

// DELETE /api/users/:id  (admin only)
async function deleteUser(req, res) {
  try {
    if (req.user.id === req.params.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });

    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
}

module.exports = { listUsers, getUserById, updateUserRole, deleteUser, getUserStats };