import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { readConfig } from '../config/env.js';

async function withServer(checkDatabase, run) {
  const server = createApp({ checkDatabase }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('health and readiness distinguish live API from unavailable database without leaking credentials', async () => {
  await withServer(async () => { throw new Error('private connection credentials'); }, async url => {
    const health = await fetch(`${url}/api/v1/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('x-powered-by'), null);
    const ready = await fetch(`${url}/api/v1/ready`);
    assert.equal(ready.status, 503);
    assert.equal(ready.headers.get('cache-control'), 'no-store');
    const error = await ready.json();
    assert.equal(error.error.code, 'DATABASE_NOT_READY');
    assert.doesNotMatch(JSON.stringify(error), /credentials/);
  });
});

test('readiness confirms probe completion and unknown routes use JSON 404', async () => {
  let calls = 0;
  await withServer(async () => { calls++; }, async url => {
    const ready = await fetch(`${url}/api/v1/ready`);
    assert.equal(ready.status, 200);
    assert.equal((await ready.json()).data.schema, 'ready');
    assert.equal(calls, 1);
    assert.equal((await fetch(`${url}/api/v1/missing`)).status, 404);
  });
});

test('invalid JSON and oversized bodies are rejected', async () => {
  await withServer(async () => {}, async url => {
    const invalid = await fetch(`${url}/api/v1/missing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, 'INVALID_JSON');
    const large = await fetch(`${url}/api/v1/missing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({text: 'a'.repeat(110000)}) });
    assert.equal(large.status, 413);
  });
});

test('environment rejects unsafe identifiers, placeholder passwords, and invalid ports', () => {
  assert.throws(() => readConfig({ DB_PASSWORD: 'example', DB_NAME: 'bad-name' }));
  assert.throws(() => readConfig({ DB_PASSWORD: 'example', API_PORT: '3001oops' }));
  assert.throws(() => readConfig({ DB_PASSWORD: 'replace-with-a-local-password' }));
});
