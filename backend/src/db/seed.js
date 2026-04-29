require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database…');
    await client.query('BEGIN');

    const password = await bcrypt.hash('password123', 12);

    const USERS = [];

    for (const u of USERS) {
      await client.query(`
        INSERT INTO users (name, email, password, role, workspace)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, [u.name, u.email, password, u.role, u.workspace]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete! Demo accounts:');
    console.log('  👑 admin@acme.com  / password123  (Admin)');
    console.log('  🎓 mentor@acme.com / password123  (Mentor)');
    console.log('  🌱 trainee@acme.com / password123 (Trainee)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));