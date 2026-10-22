import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cacheDir = await mkdtemp(join(tmpdir(), 'kindsight-test-'));
const vite = await createServer({ configFile: false, cacheDir, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
after(async () => { await vite.close(); await rm(cacheDir, { recursive: true, force: true }); });
const { getDashboardReport, getCampaigns, getDonors } = await vite.ssrLoadModule('/src/services/mock/dashboard.ts');
const { validatePeriod, cents } = await vite.ssrLoadModule('/src/services/dashboard-utils.ts');
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
const session = new Map();
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => session.get(key) ?? null, setItem: (key, value) => session.set(key, value), removeItem: key => session.delete(key) } });
after(() => { if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage); else delete globalThis.sessionStorage; });
const { useMemoryStoreForTests } = await vite.ssrLoadModule('/src/services/mock/store.ts');
useMemoryStoreForTests();
const auth = await vite.ssrLoadModule('/src/services/mock/auth.ts');
await auth.signIn({ email: 'admin@example.test', password: 'KindsightDemo1!' });
const period = { from: '2026-10-01', to: '2026-11-01', interval: 'day', scenario: 'success' };
test('summary excludes pending/cancelled/archived; trend exactly reconciles', async () => {
  const report = await getDashboardReport(period);
  assert.deepEqual(report.summary, { totalRaised: '5250.00', previousTotalRaised: '10000.00', donationCount: 2, knownDonorCount: 1, anonymousDonationCount: 1, averageDonation: '2625.00', growthPercent: '-47.50' });
  assert.equal(report.trend.length, 31);
  assert.equal(report.trend.reduce((total, point) => total + cents(point.totalRaised), 0n), cents(report.summary.totalRaised));
  assert.deepEqual(report.meta.comparison, { from: '2026-08-31', to: '2026-10-01' });
});
test('exclusive boundaries, clipped monthly bucket and zero baseline', async () => {
  const clipped = await getDashboardReport({ ...period, from: '2026-10-10', to: '2026-10-15', interval: 'month' });
  assert.deepEqual(clipped.trend, [{ bucket: '2026-10-01', totalRaised: '5000.00', donationCount: 1 }]);
  assert.equal(clipped.summary.growthPercent, null);
});
test('empty period shows zero, never fake growth or infinity', async () => {
  const empty = await getDashboardReport({ ...period, from: '2026-11-01', to: '2026-12-01' });
  assert.equal(empty.summary.totalRaised, '0.00');
  assert.equal(empty.summary.donationCount, 0);
  assert.equal(empty.summary.growthPercent, '-100.00');
  const zero = await getDashboardReport({ ...period, scenario: 'empty' });
  assert.equal(zero.summary.growthPercent, null);
  assert.ok(zero.trend.every(point => point.totalRaised === '0.00'));
});
test('invalid calendar dates and periods rejected; leap day accepted', () => {
  for (const [from, to] of [['2026-02-29', '2026-03-01'], ['2026-10-10', '2026-10-10'], ['2026-10-20', '2026-10-10'], ['2025-01-01', '2026-01-03'], ['', '2026-10-01']]) assert.throws(() => validatePeriod(from, to));
  assert.doesNotThrow(() => validatePeriod('2024-02-29', '2024-03-01'));
});
test('campaign progress is lifetime; zero target unavailable', async () => {
  const rows = await getCampaigns('success');
  assert.equal(rows[0].progressPercent, '10.00');
  assert.equal(rows[1].progressPercent, '40.00');
  assert.equal(rows[2].progressPercent, null);
  assert.deepEqual(await getCampaigns('empty'), []);
});
test('donor search and pagination have disjoint pages and consistent totals', async () => {
  const first = await getDonors('', 1, 'success'), second = await getDonors('', 2, 'success'), last = await getDonors('', 3, 'success');
  assert.equal(first.meta.total, 12); assert.equal(first.meta.pages, 3);
  assert.equal(new Set([...first.data, ...second.data, ...last.data].map(row => row.id)).size, 12);
  assert.equal((await getDonors('avery', 1, 'success')).data[0].name, 'Avery Morgan');
  assert.deepEqual((await getDonors('absent', 1, 'success')).data, []);
  await assert.rejects(getDonors('', 0, 'success'));
});
test('errors and cancellation do not silently return fixture data', async () => {
  await assert.rejects(getDashboardReport({ ...period, scenario: 'error' }));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(getDashboardReport(period, { signal: controller.signal }));
});
test('mock auth validates credentials, stores only marker, expires and signs out', async () => {
  const storage = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  try {
    const { signIn, getSession, signOut } = await vite.ssrLoadModule('/src/services/mock/auth.ts');
    assert.equal(await getSession(), null);
    await assert.rejects(signIn({ email: 'admin@example.test', password: 'wrong' }));
    const account = await signIn({ email: ' admin@example.test ', password: 'KindsightDemo1!' });
    assert.equal(account.email, 'admin@example.test');
    assert.ok(![...storage.values()][0].includes('KindsightDemo1!'));
    assert.deepEqual(await getSession(), account);
    const marker = JSON.parse([...storage.values()][0]); marker.expires = 1;
    storage.set([...storage.keys()][0], JSON.stringify(marker));
    assert.equal(await getSession(), null);
    await signIn({ email: 'admin@example.test', password: 'KindsightDemo1!' });
    await signOut(); assert.equal(await getSession(), null);
  } finally { if (original) Object.defineProperty(globalThis, 'sessionStorage', original); else delete globalThis.sessionStorage; }
});

test('login return URL stays inside dashboard/admin routes', async () => {
  const { safeReturnTo } = await vite.ssrLoadModule('/src/services/auth-utils.ts');
  for (const value of [null, '//external.test', 'https://external.test', '/dashboardevil', '/admin/../../outside', '/dashboard\\external', '/login']) assert.equal(safeReturnTo(value), '/app/dashboard');
  assert.equal(safeReturnTo('/dashboard?interval=month&page=2#chart'), '/app/dashboard?interval=month&page=2#chart');
  assert.equal(safeReturnTo('/admin/donors?search=Avery'), '/app/donors?search=Avery');
});
