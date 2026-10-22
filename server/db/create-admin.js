import { randomBytes, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import { hashPassword } from '../auth/password.js';

let pool;
try {
  pool = createDatabasePool(readConfig().database);
  const email = (process.env.ADMIN_EMAIL || 'admin@kindsight.local').trim().toLowerCase();
  const name = process.env.ADMIN_NAME || 'Kindsight Admin';
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || randomBytes(24).toString('base64url');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || name.length > 120 || !name.trim() || password.length < 12 || password.length > 128) {
    throw new Error('Provide a valid ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (12–128 characters).');
  }
  const [[existing]] = await pool.execute('SELECT id FROM admins WHERE email = ?', [email]);
  if (existing) {
    console.log('Admin already exists. No password or account data changed.');
  } else {
    // Write before insertion so failure cannot leave a generated password inaccessible.
    if (generated) await writeFile(new URL('../../.admin-credentials.local', import.meta.url), JSON.stringify({email, password}, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await pool.execute('INSERT INTO admins (id, email, name, password_hash) VALUES (?, ?, ?, ?)', [randomUUID(), email, name.trim(), await hashPassword(password)]);
    console.log(generated ? 'Admin created. Generated credentials saved in .admin-credentials.local (ignored by Git).' : 'Admin created using environment credentials.');
  }
} catch (error) {
  console.error('Admin provisioning failed:', error.code || error.message);
  process.exitCode = 1;
} finally { await pool?.end(); }
