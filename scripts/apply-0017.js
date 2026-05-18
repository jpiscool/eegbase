const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  if (!process.env.DATABASE_URL) { console.log('no DATABASE_URL'); process.exit(1); }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const check = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='clients' AND column_name='dashboard_widgets'"
  );
  console.log('column exists:', check.rows.length > 0);
  if (check.rows.length === 0) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'drizzle', '0017_client_dashboard_widgets.sql'), 'utf8');
    await pool.query(sql);
    console.log('migration applied');
  }
  await pool.end();
})().catch(e => { console.error('error:', e.message); process.exit(1); });
