import { Router } from 'express';
import { dashboardPeriod,campaignQuery } from '../services/dashboard.js';

export function createDashboardRouter(repository) {
  const router = Router();
  const repo=request=>repository(request.user.organization.id);
  router.get('/summary',async (request,response)=>response.json(await repo(request).summary(dashboardPeriod(request.query))));
  router.get('/trend',async (request,response)=>response.json(await repo(request).trend(dashboardPeriod(request.query,true))));
  router.get('/campaigns',async (request,response)=>response.json(await repo(request).campaigns(campaignQuery(request.query))));
  return router;
}
