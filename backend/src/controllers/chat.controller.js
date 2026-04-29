const { query } = require('../config/db');
const { ragQuery } = require('../services/rag.service');

// ── Sessions ──────────────────────────────────────────────────────────────────

// GET /api/chat/sessions
async function getSessions(req, res) {
  try {
    const { workspace } = req.query;
    const { rows } = await query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS message_count
       FROM chat_sessions s
       WHERE s.user_id = $1
       ORDER BY s.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
}

// POST /api/chat/sessions
async function createSession(req, res) {
  try {
    const { title } = req.body;
    const { rows } = await query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2) RETURNING *`,
      [req.user.id, title?.slice(0, 200) || 'New Chat']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create session' });
  }
}

// DELETE /api/chat/sessions/:id
async function deleteSession(req, res) {
  try {
    const { rowCount } = await query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete session' });
  }
}

// ── Messages ──────────────────────────────────────────────────────────────────

// GET /api/chat/sessions/:id/messages
async function getMessages(req, res) {
  try {
    // Verify session belongs to user
    const sess = await query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!sess.rows[0]) return res.status(404).json({ message: 'Session not found' });

    const { rows } = await query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

// POST /api/chat/sessions/:id/messages  — the main RAG endpoint
async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const sessionId = req.params.id;

    // Verify session belongs to user
    const sess = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!sess.rows[0]) return res.status(404).json({ message: 'Session not found' });

    // Save user message
    await query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, message.trim()]
    );

    // Update session title if it's the first message
    if (sess.rows[0].title === 'New Chat') {
      await query(
        `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
        [message.slice(0, 80), sessionId]
      );
    }

    // ── RAG Pipeline ──
    const { answer, sources } = await ragQuery(message.trim());

    // Save assistant message
    const { rows } = await query(
      `INSERT INTO chat_messages (session_id, role, content, sources)
       VALUES ($1, 'assistant', $2, $3) RETURNING *`,
      [sessionId, answer, JSON.stringify(sources)]
    );

    // Update session timestamp
    await query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);

    res.json(rows[0]);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Failed to process message', error: err.message });
  }
}

// DELETE /api/chat/messages/:id
async function deleteMessage(req, res) {
  try {
    const { id } = req.params;
    // Verify message belongs to a session owned by the user
    const { rows } = await query(
      `SELECT m.id FROM chat_messages m
       JOIN chat_sessions s ON m.session_id = s.id
       WHERE m.id = $1 AND s.user_id = $2`,
      [id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Message not found or unauthorized' });

    await query('DELETE FROM chat_messages WHERE id = $1', [id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
}

module.exports = { getSessions, createSession, deleteSession, getMessages, sendMessage, deleteMessage };