import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import { seedId, seedShowcase } from './seeds/showcase.js';

let pool;
let connection;
let lockName;
let locked = false;
try {
  pool = createDatabasePool(readConfig().database);
  connection = await pool.getConnection();
  const [[database]] = await connection.query('SELECT DATABASE() AS name');
  lockName = `${database.name}:seed`;
  const [[lock]] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
  if (lock.acquired !== 1) throw new Error('Another seed is running. Retry later.');
  locked = true;
  await connection.beginTransaction();
  const [[existing]] = await connection.execute('SELECT id FROM seed_runs WHERE id = ?', [seedId]);
  if (existing) {
    console.log('Showcase seed already applied; existing data left unchanged.');
  } else {
    await seedShowcase(connection);
    await connection.execute('INSERT INTO seed_runs (id) VALUES (?)', [seedId]);
    console.log('Showcase seed applied: 2 donors, 2 campaigns, 5 donations, 10 landing sections.');
  }
  await connection.commit();
} catch (error) {
  await connection?.rollback();
  console.error('Seed failed:', error.code || error.message);
  process.exitCode = 1;
} finally {
  try { if (locked) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]); }
  finally { connection?.release(); await pool?.end(); }
}
