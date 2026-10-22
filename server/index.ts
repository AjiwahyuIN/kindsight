import { createPartnerLogoRepository } from './repositories/partner-logos.js';
import { createDashboardRepository } from './repositories/dashboard.js';
import { createLandingRepository } from './repositories/landing.js';
import { createFundraisingRepository } from './repositories/fundraising.js';
import { createAuthRepository } from './repositories/auth.js';
import { createApp } from './app.js';
import { readConfig } from './config/env.js';
import { createDatabasePool } from './config/database.js';

import type { RowDataPacket } from 'mysql2/promise';
import { createUsersRouter } from './react/users.ts';
import { createOrganizationsRouter } from './react/organizations.ts';
import { createDemoRequestRouters } from './react/demo-requests.ts';
import { createAdminOverviewRouter } from './react/admin-overview.ts';
import { createContentRouter } from './react/content.ts';

const config = readConfig();
const pool = createDatabasePool(config.database);
const logos = createPartnerLogoRepository(pool);
const app = createApp({
  users:createUsersRouter(pool),
  organizations:createOrganizationsRouter(pool),
  demoRequests:createDemoRequestRouters(pool),
  overview:createAdminOverviewRouter(pool),
  content: { public: createContentRouter(pool), admin: createContentRouter(pool,{admin:true,catalog:()=>logos.list()}) }, logos, landing:createLandingRepository(pool), dashboard:organizationId=>createDashboardRepository(pool,organizationId), fundraising:organizationId=>createFundraisingRepository(pool,organizationId), auth: { ...config.auth, repository: createAuthRepository(pool) }, checkDatabase: async () => {
  const [[row]] = await pool.execute<RowDataPacket[]>('SELECT id FROM schema_migrations WHERE id = ?', ['007-account-revisions']);
  if (!row) throw new Error('Schema not initialized');
} });
const server = app.listen(config.port, config.host);
server.once('listening', () => console.log(`Kindsight API: http://${config.host}:${config.port}/api/v1/health`));
server.on('error', async error => {
  console.error('API startup failed:', (error as NodeJS.ErrnoException).code || 'UNKNOWN');
  await pool.end();
  process.exitCode = 1;
});
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 5000).unref();
  server.close(async () => {
    await pool.end();
    clearTimeout(timeout);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
