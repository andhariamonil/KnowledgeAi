const { query } = require('../config/db');

// GET /api/stats/dashboard
async function getDashboard(req, res) {
  try {
    const { workspace } = req.query;
    const ws = workspace || req.user?.workspace || '';

    const [docsRes, chunksRes, queriesRes, usersRes, recentRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'indexed') AS indexed
             FROM documents WHERE ($1 = '' OR workspace_id = $1)`, [ws]),
      query(`SELECT COUNT(*) AS total FROM document_chunks dc
             JOIN documents d ON dc.document_id = d.id
             WHERE ($1 = '' OR d.workspace_id = $1)`, [ws]),
      query(`SELECT COUNT(*) AS total
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cm.role = 'user'
               AND ($1 = '' OR cs.workspace_id = $1)`, [ws]),
      query(`SELECT COUNT(*) AS total FROM users WHERE is_active = true`),
      query(`SELECT cm.content AS text, cm.created_at,
                    cs.user_id, cs.id AS session_id, cs.title
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cm.role = 'user'
               AND ($1 = '' OR cs.workspace_id = $1)
             ORDER BY cm.created_at DESC LIMIT 5`, [ws]),
    ]);

    res.json({
      totalDocuments:  parseInt(docsRes.rows[0].total),
      indexedDocuments: parseInt(docsRes.rows[0].indexed),
      totalChunks:     parseInt(chunksRes.rows[0].total),
      totalQueries:    parseInt(queriesRes.rows[0].total),
      activeUsers:     parseInt(usersRes.rows[0].total),
      avgResponseTime: '1.4s', // could instrument later
      recentQueries:   recentRes.rows,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

module.exports = { getDashboard };