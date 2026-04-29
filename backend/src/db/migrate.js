require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running migrations…');

    await client.query('BEGIN');

    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ── Users ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20)  NOT NULL DEFAULT 'trainee'
                    CHECK (role IN ('admin', 'mentor', 'trainee')),
        workspace   VARCHAR(255),
        preferences JSONB DEFAULT '{}',
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'
    `);

    // ── Workspaces ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(255) NOT NULL,
        owner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Documents ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        file_type     VARCHAR(20),
        file_size     BIGINT,
        file_path     VARCHAR(1000),
        workspace_id  VARCHAR(255),
        uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        status        VARCHAR(20) DEFAULT 'processing'
                      CHECK (status IN ('processing', 'indexed', 'failed')),
        chunk_count   INTEGER DEFAULT 0,
        metadata      JSONB DEFAULT '{}',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Document Chunks (with pgvector embedding) ──────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id  UUID REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index  INTEGER NOT NULL,
        content      TEXT NOT NULL,
        embedding    vector(384),
        metadata     JSONB DEFAULT '{}',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // IVFFlat index for fast ANN search
    await client.query(`
      CREATE INDEX IF NOT EXISTS chunks_embedding_idx
      ON document_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Full-text search index for keyword search
    await client.query(`
      CREATE INDEX IF NOT EXISTS chunks_fts_idx
      ON document_chunks
      USING gin (to_tsvector('english', content))
    `);

    // ── Chat Sessions ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
        title        VARCHAR(500) DEFAULT 'New Chat',
        workspace_id VARCHAR(255),
        message_count INTEGER DEFAULT 0,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Chat Messages ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content    TEXT NOT NULL,
        sources    JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── updated_at trigger ─────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `);

    for (const tbl of ['users', 'documents', 'chat_sessions']) {
      await client.query(`
        DROP TRIGGER IF EXISTS set_updated_at ON ${tbl};
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON ${tbl}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
      `);
    }

    await client.query('COMMIT');
    console.log('✅ Migrations complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));