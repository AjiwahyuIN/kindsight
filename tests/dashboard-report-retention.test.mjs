import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cacheDir = await mkdtemp(join(tmpdir(), 'kindsight-report-retention-'));
const server = await createServer({ configFile: false, cacheDir, server: { middlewareMode: true }, appType: 'custom' });
after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
const { previousScopedReport } = await server.ssrLoadModule('/src/queries/dashboard.ts');
const report = { summary: { totalRaised: '5250.00' }, trend: [], meta: { interval: 'day' } };
const scope = ['private', 'account-a', 'organization-a'];
const key = [...scope, 'dashboard', 'report', { interval: 'day' }];
test('interval changes can retain the exact accepted report only within the same private scope', () => {
  assert.equal(previousScopedReport(report, key, scope, true), report);
  assert.equal(report.meta.interval, 'day', 'retained Daily data must not be relabeled Monthly');
  for (const next of [['private', 'account-b', 'organization-a'], ['private', 'account-a', 'organization-b'], ['private', 'guest', 'platform']]) {
    assert.equal(previousScopedReport(report, key, next, true), undefined);
  }
  assert.equal(previousScopedReport(report, key, scope, false), undefined);
  assert.equal(previousScopedReport(report, undefined, scope, true), undefined);
  assert.equal(previousScopedReport(report, [...scope, 'dashboard', 'donors'], scope, true), undefined);
});
