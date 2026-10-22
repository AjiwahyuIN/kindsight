import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';

let pool;
try {
  pool = createDatabasePool(readConfig().database);
  const [migrations] = await pool.execute('SELECT id FROM schema_migrations WHERE id IN (?, ?, ?, ?, ?, ?, ?)', ['001-initial','002-partner-logos','003-record-revisions','004-organizations','005-demo-request-revisions','006-organization-revisions','007-account-revisions']);
  if (migrations.length !== 7) throw new Error('Run npm run db:migrate first.');
  const [[row]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM donors) AS donors,
    (SELECT COUNT(*) FROM campaigns) AS campaigns,
    (SELECT COUNT(*) FROM donations) AS donations,
    (SELECT COUNT(*) FROM landing_sections) AS landing_sections`);
  console.log('Database connected; schema ready. Record counts:', row);
} catch (error) {
  console.error('Database check failed:', error.code || error.message);
  process.exitCode = 1;
} finally { await pool?.end(); }
