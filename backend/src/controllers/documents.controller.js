const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { parseDocument } = require('../services/document.service');
const { indexDocument } = require('../services/rag.service');

// LIST
async function listDocuments(req, res) {
  try {
    const { rows } = await query(`
      SELECT d.*, u.name AS uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.created_at DESC
    `);

    res.json(rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
}

// GET ONE
async function getDocumentById(req, res) {
  try {
    const { rows } = await query(
      'SELECT * FROM documents WHERE id = $1',
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Not found' });

    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: 'Error' });
  }
}

// UPLOAD
async function uploadDocument(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file' });

  const { originalname, filename, size, path: filePath } = req.file;

  const { rows } = await query(
    `INSERT INTO documents 
    (name, original_name, file_size, file_path, uploaded_by, status)
    VALUES ($1,$2,$3,$4,$5,'processing') RETURNING *`,
    [filename, originalname, size, filePath, req.user.id]
  );

  const doc = rows[0];

  res.status(202).json(doc);

  setImmediate(async () => {
    try {
      const { text } = await parseDocument(filePath, originalname);
      await indexDocument(doc.id, text);
    } catch {
      await query(`UPDATE documents SET status='failed' WHERE id=$1`, [doc.id]);
    }
  });
}

// DELETE
async function deleteDocument(req, res) {
  const { rows } = await query(
    'SELECT * FROM documents WHERE id = $1',
    [req.params.id]
  );

  const doc = rows[0];
  if (!doc) return res.status(404).json({ message: 'Not found' });

  if (fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }

  await query('DELETE FROM documents WHERE id=$1', [req.params.id]);

  res.json({ message: 'Deleted' });
}

// OPEN
async function openDocument(req, res) {
  const { rows } = await query(
    'SELECT * FROM documents WHERE id = $1',
    [req.params.id]
  );

  const doc = rows[0];
  if (!doc) return res.status(404).json({ message: 'Not found' });

  if (!fs.existsSync(doc.file_path)) {
    return res.status(404).json({ message: 'File missing' });
  }

  res.sendFile(path.resolve(doc.file_path));
}

module.exports = {
  listDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  openDocument,
};