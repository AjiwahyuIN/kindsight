import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import * as initial from './migrations/001-initial.js';
import * as logos from './migrations/002-partner-logos.js';
import * as organizations from './migrations/004-organizations.js';
import * as demoRequests from './migrations/005-demo-request-revisions.js';
import * as organizationRevisions from './migrations/006-organization-revisions.js';
import * as accountRevisions from './migrations/007-account-revisions.js';
import * as revisions from './migrations/003-record-revisions.js';

export async function migrate(pool) {
  const connection = await pool.getConnection();
  let locked = false;
  let lockName;
  try {
    const [[database]] = await connection.query('SELECT DATABASE() AS name');
    lockName = `${database.name}:migrate`;
    const [[lock]] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    if (lock.acquired !== 1) throw new Error('Another migration is running. Retry later.');
    locked = true;
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB`);
    let applied = 0;
    for (const migration of [initial, logos, revisions, organizations, demoRequests, organizationRevisions, accountRevisions]) {
      const source = await readFile(new URL(`./migrations/${migration.id}.js`, import.meta.url));
      const checksum = createHash('sha256').update(source).digest('hex');
      const [[existing]] = await connection.execute('SELECT checksum FROM schema_migrations WHERE id = ?', [migration.id]);
      if (existing && existing.checksum !== checksum) throw new Error('Applied migration changed. Add a new migration instead of editing an applied file.');
      if (!existing) {
        await migration.up(connection);
        await connection.execute('INSERT INTO schema_migrations (id, checksum) VALUES (?, ?)', [migration.id, checksum]);
        applied++;
      }
    }
    return { applied };
  } finally {
    try { if (locked) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]); }
    finally { connection.release(); }
  }
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  let pool;
  try {
    pool = createDatabasePool(readConfig().database);
    console.log('Migrations:', await migrate(pool));
  } catch (error) {
    console.error('Migration failed:', error.code || error.message);
    process.exitCode = 1;
  } finally { await pool?.end(); }
}
