const fs   = require('fs');
const path = require('path');

/**
 * Extract raw text from an uploaded file based on its extension.
 * Returns { text, pageCount? }
 */
async function parseDocument(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase().replace('.', '');

  switch (ext) {
    case 'pdf':
      return parsePdf(filePath);
    case 'txt':
    case 'md':
      return parsePlainText(filePath);
    case 'docx':
    case 'doc':
      return parseDocx(filePath);
    case 'csv':
      return parseCsv(filePath);
    case 'xlsx':
      return parseXlsx(filePath);
    default:
      return parsePlainText(filePath);
  }
}

async function parsePdf(filePath) {
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return { text: data.text, pageCount: data.numpages };
}

async function parsePlainText(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  return { text };
}

async function parseDocx(filePath) {
  try {
    // Try mammoth if available
    const mammoth = require('mammoth');
    const result  = await mammoth.extractRawText({ path: filePath });
    return { text: result.value };
  } catch {
    // Fallback: read as binary, extract readable text
    const raw = fs.readFileSync(filePath, 'latin1');
    const text = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return { text };
  }
}

async function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  // Convert CSV rows to readable sentences
  const lines  = text.split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows   = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return header.map((h, i) => `${h}: ${vals[i] || ''}`).join(', ');
  });
  return { text: rows.join('\n'), rowCount: rows.length };
}

async function parseXlsx(filePath) {
  const xlsx = require('xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheets = workbook.SheetNames.map((name) => {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' });
    const lines = rows
      .filter((row) => Array.isArray(row) && row.some((cell) => String(cell).trim()))
      .map((row) => row.map((cell) => String(cell).trim()).join(' | '));
    return [`Sheet: ${name}`, ...lines].join('\n');
  });
  return { text: sheets.join('\n\n') };
}

module.exports = { parseDocument };