import express from 'express';
import { createPartnerLogoRouter } from './routes/partner-logos.js';
import { createAuth } from './routes/auth.js';
import { createDashboardRouter } from './routes/dashboard.js';
import { createFundraisingRouter } from './routes/fundraising.js';
import { createLandingRouter } from './routes/landing.js';
import { RequestError } from './services/fundraising-validation.js';

/** @param {import('./types.ts').AppOptions} options */
export function createApp({ users, organizations, demoRequests, overview, auth, fundraising, dashboard, landing, logos, logoStorage, content, checkDatabase = async () => { await Promise.reject(new Error('No database configured')); } } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/v1/health', (request, response) => {
    response.json({ data: { status: 'ok', service: 'kindsight-api' } });
  });
  app.get('/api/v1/ready', async (request, response) => {
    try {
      await checkDatabase();
      response.json({ data: { status: 'ready', database: 'connected', schema: 'ready' } });
    } catch {
      response.status(503).json({ error: { code: 'DATABASE_NOT_READY', message: 'Local database is unavailable or migrations have not been applied.' } });
    }
  });
  if(content)app.use('/api/v1/content',content.public);
  if(logos)app.use('/api/v1/partner-logos',createPartnerLogoRouter(logos,{directory:logoStorage}));
  if(landing)app.use('/api/v1/landing',createLandingRouter(landing));
  if (auth) {
    const { router, requireSession, requireRole, protectMutation, protectUpload } = createAuth(auth);
    app.use('/api/v1/auth', router);
    if(demoRequests)app.use('/api/v1/demo-requests',(request,response,next)=>request.method==='POST'?protectMutation(request,response,next):next(),demoRequests.public);
    app.use('/api/v1/app',requireSession,requireRole('organization_user'),(request,response,next)=>['GET','HEAD','OPTIONS'].includes(request.method)?next():protectMutation(request,response,next));
    if(fundraising)app.use('/api/v1/app',createFundraisingRouter(fundraising));
    if(dashboard)app.use('/api/v1/app/dashboard',createDashboardRouter(dashboard));
    app.use('/api/v1/admin', requireSession, requireRole('platform_admin'), (request, response, next) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
      if(logos&&request.method==='POST'&&/^\/partner-logos\/?$/.test(request.path))return protectUpload(request,response,next);
      protectMutation(request, response, next);
    });
    if(users)app.use('/api/v1/admin/users',users);
    if(organizations)app.use('/api/v1/admin/organizations',organizations);
    if(demoRequests)app.use('/api/v1/admin/demo-requests',demoRequests.admin);
    if(overview)app.use('/api/v1/admin/overview',overview);
    if(content)app.use('/api/v1/admin/content',content.admin);
    if (logos) app.use('/api/v1/admin/partner-logos',createPartnerLogoRouter(logos,{admin:true,directory:logoStorage}));
    // Legacy global ledger endpoints intentionally remain unmounted. No role can bypass tenant scope.
    if (landing) app.use('/api/v1/admin/landing',createLandingRouter(landing,true,logos));
  }
  app.use((request, response) => response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }));
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error instanceof RequestError) return response.status(error.status).json({error:{code:error.code,message:error.message,...(error.fields ? {fields:error.fields} : {})}});
    if (['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) return response.status(409).json({error:{code:'CONCURRENT_UPDATE',message:'Another update is in progress. Please retry.'}});
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    const code = status === 400 ? 'INVALID_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR';
    response.status(status).json({ error: { code, message: status === 500 ? 'An internal error occurred.' : 'Invalid request body.' } });
  });
  return app;
}
