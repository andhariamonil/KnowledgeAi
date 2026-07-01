require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const { query }  = require('./config/db');

const authRoutes      = require('./routes/auth.routes');
const usersRoutes     = require('./routes/users.routes');
const documentsRoutes = require('./routes/documents.routes');
const chatRoutes      = require('./routes/chat.routes');
const statsRoutes     = require('./routes/stats.routes');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite default
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 15,
  message: { message: 'Too many chat requests. Please slow down.' },
});

app.use('/api/', globalLimiter);
app.use('/api/chat/sessions/:id/messages', chatLimiter);

// ── Static Uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    groq: !!process.env.GROQ_API_KEY,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/stats',     statsRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 50}MB.` });
  }

  // Multer file type error
  if (err.message?.includes('not supported')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

async function start() {
  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`);
  } catch (err) {
    console.warn('Schema sync warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n🧠 KnowledgeAI Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🤖 Groq: ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ GROQ_API_KEY missing - using fallback answers'}`);
    console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
start();

module.exports = app;