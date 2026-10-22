import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';

test('MySQL preserves decimal totals, anonymous donations, status filters and integrity constraints', async () => {
  const pool = createDatabasePool(readConfig().database);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const organizationId=randomUUID();
    await connection.execute('INSERT INTO organizations (id,name) VALUES (?,?)',[organizationId,'Rolled back organization']);
    const campaign = randomUUID();
    const donor = randomUUID();
    await connection.execute('INSERT INTO donors (organization_id,id, name) VALUES (?,?, ?)', [organizationId,donor, 'Temporary integration fixture']);
    await connection.execute('INSERT INTO campaigns (organization_id,id, name, description, target_amount) VALUES (?,?, ?, ?, ?)', [organizationId,campaign, 'Temporary fixture', 'Rolled back by test', '10.00']);
    for (const [amount, status, donorId] of [['0.10', 'received', donor], ['0.20', 'received', null], ['9.00', 'pending', null]]) {
      await connection.execute('INSERT INTO donations (organization_id,id, donor_id, campaign_id, amount, status, received_at) VALUES (?,?, ?, ?, ?, ?, ?)', [organizationId,randomUUID(), donorId, campaign, amount, status, status === 'received' ? '2026-10-19 00:00:00' : null]);
    }
    const [[totals]] = await connection.execute("SELECT SUM(amount) AS raised, COUNT(DISTINCT donor_id) AS donors FROM donations WHERE campaign_id = ? AND status = 'received'", [campaign]);
    assert.equal(totals.raised, '0.30');
    assert.equal(totals.donors, 1);
    for (const [amount, currency, status, receivedAt] of [['0.00','USD','pending',null], ['1.00','EUR','pending',null], ['1.00','USD','received',null]]) {
      await assert.rejects(connection.execute('INSERT INTO donations (organization_id,id, amount, currency, status, received_at) VALUES (?,?, ?, ?, ?, ?)', [organizationId,randomUUID(), amount, currency, status, receivedAt]), error => error.code === 'ER_CHECK_CONSTRAINT_VIOLATED');
    }
    await assert.rejects(connection.execute('INSERT INTO donations (organization_id,id, donor_id, amount) VALUES (?,?, ?, ?)', [organizationId,randomUUID(), randomUUID(), '1.00']), error => error.code === 'ER_NO_REFERENCED_ROW_2');
    await connection.rollback();
    const [[restored]] = await connection.execute('SELECT COUNT(*) AS total FROM campaigns WHERE id = ?', [campaign]);
    assert.equal(restored.total, 0);
  } finally {
    await connection.rollback();
    connection.release();
    await pool.end();
  }
});
