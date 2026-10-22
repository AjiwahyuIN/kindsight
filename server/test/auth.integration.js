import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { readConfig } from '../config/env.js';
import { createDatabasePool } from '../config/database.js';
import { createAuthRepository } from '../repositories/auth.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { tokenHash } from '../routes/auth.js';

const origin = 'http://127.0.0.1:5175';
const headers = {'Content-Type': 'application/json', Origin: origin, 'X-Kindsight-Request': '1'};

async function fixture(run, limit = 30) {
  const pool = createDatabasePool(readConfig().database);
  const id = randomUUID();
  const email = `${id}@example.test`;
  const password = randomBytes(24).toString('hex');
  let server;
  try {
    await pool.execute('INSERT INTO admins (id, email, name, password_hash) VALUES (?, ?, ?, ?)', [id, email, 'Temporary auth test', await hashPassword(password)]);
    const repository = createAuthRepository(pool);
    server = createApp({ auth: {repository, origins: [origin], loginLimit: limit} }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/api/v1`;
    const login = (body = {email, password}, extraHeaders = {}) => fetch(`${url}/auth/login`, {method:'POST', headers: {...headers, ...extraHeaders}, body: JSON.stringify(body)});
    await run({pool, id, email, password, url, login});
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.execute('DELETE FROM sessions WHERE admin_id = ?', [id]);
    await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
    await pool.end();
  }
}

const cookieOf = response => response.headers.get('set-cookie').split(';')[0];

test('password hashes are salted; correct, wrong and malformed hashes behave safely', async () => {
  const first = await hashPassword('A long local test password');
  const second = await hashPassword('A long local test password');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('A long local test password', first), true);
  assert.equal(await verifyPassword('wrong', first), false);
  assert.equal(await verifyPassword('wrong', 'broken'), false);
});

test('login → stored session → me → session rotation → logout invalidates the token', async () => {
  await fixture(async ({pool, id, email, url, login}) => {
    assert.equal((await fetch(`${url}/auth/me`)).status, 401);
    assert.equal((await fetch(`${url}/admin/donors`)).status, 401);
    const response = await login();
    assert.equal(response.status, 200);
    const setCookie = response.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    assert.match(setCookie, /Max-Age=28800/);
    const cookie = cookieOf(response);
    const token = cookie.slice(cookie.indexOf('=') + 1);
    const [[stored]] = await pool.execute('SELECT session_id FROM sessions WHERE admin_id = ?', [id]);
    assert.equal(stored.session_id, tokenHash(token));
    assert.notEqual(stored.session_id, token);
    const body = await response.json();
    assert.equal(body.data.user.email, email);
    assert.equal('password_hash' in body.data.user, false);
    const me = await fetch(`${url}/auth/me`, {headers: {Cookie: cookie}});
    assert.equal(me.status, 200);
    assert.equal((await me.json()).data.user.id, id);
    const next = await login(undefined, {Cookie: cookie});
    assert.equal(next.status, 200);
    const nextCookie = cookieOf(next);
    assert.notEqual(nextCookie, cookie);
    assert.equal((await fetch(`${url}/auth/me`, {headers: {Cookie: cookie}})).status, 401);
    const logout = await fetch(`${url}/auth/logout`, {method: 'POST', headers: {...headers, Cookie: nextCookie}, body:'{}'});
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await fetch(`${url}/auth/me`, {headers: {Cookie: nextCookie}})).status, 401);
  });
});

test('incorrect credentials, inactive admin, expired and forged sessions are rejected', async () => {
  await fixture(async ({pool, id, email, url, login}) => {
    const wrong = await login({email, password: 'wrong'});
    const unknown = await login({email: 'missing@example.test', password:'wrong'});
    assert.equal(wrong.status, 401);
    assert.deepEqual(await unknown.json(), await wrong.json());
    assert.equal((await login({email: [], password:'wrong'})).status, 400);
    let response = await login();
    let cookie = cookieOf(response);
    await pool.execute("UPDATE sessions SET expires_at = UTC_TIMESTAMP(3) - INTERVAL 1 SECOND WHERE admin_id = ?", [id]);
    assert.equal((await fetch(`${url}/auth/me`, {headers:{Cookie:cookie}})).status, 401);
    response = await login();
    cookie = cookieOf(response);
    await pool.execute('UPDATE admins SET active = FALSE WHERE id = ?', [id]);
    assert.equal((await login()).status, 401);
    assert.equal((await fetch(`${url}/auth/me`, {headers:{Cookie:cookie}})).status, 401);
    assert.equal((await fetch(`${url}/auth/me`, {headers:{Cookie:'kindsight_session=forged'}})).status, 401);
  });
});

test('cross-origin login/logout and missing request header fail; repeated failures are limited', async () => {
  await fixture(async ({email, url, login}) => {
    assert.equal((await login(undefined, {Origin:'https://untrusted.example'})).status, 403);
    assert.equal((await login(undefined, {'X-Kindsight-Request':''})).status, 403);
    assert.equal((await fetch(`${url}/auth/logout`, {method:'POST', headers:{...headers,Origin:'https://untrusted.example'},body:'{}'})).status, 403);
    assert.equal((await login({email,password:'wrong'})).status, 401);
    assert.equal((await login({email,password:'wrong'})).status, 401);
    const limited = await login();
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
  }, 2);
});
