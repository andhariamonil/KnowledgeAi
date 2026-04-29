const { query } = require('../config/db');

// GET /api/stats/dashboard
async function getDashboard(req, res) {
  try {
    const [docsRes, chunksRes, queriesRes, usersRes, recentRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'indexed') AS indexed
             FROM documents`),
      query(`SELECT COUNT(*) AS total FROM document_chunks`),
      query(`SELECT COUNT(*) AS total
             FROM chat_messages cm
             WHERE cm.role = 'user'`),
      query(`SELECT COUNT(*) AS total FROM users`),
      query(`SELECT cm.content AS text, cm.created_at,
                    cs.user_id, cs.id AS session_id, cs.title
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cm.role = 'user' AND cs.user_id = $1
             ORDER BY cm.created_at DESC LIMIT 5`, [req.user.id]),
    ]);

    res.json({
      totalDocuments:  parseInt(docsRes.rows[0].total),
      indexedDocuments: parseInt(docsRes.rows[0].indexed),
      totalChunks:     parseInt(chunksRes.rows[0].total),
      totalQueries:    parseInt(queriesRes.rows[0].total),
      activeUsers:     parseInt(usersRes.rows[0].total),
      avgResponseTime: '1.4s', 
      recentQueries:   recentRes.rows,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

module.exports = { getDashboard };