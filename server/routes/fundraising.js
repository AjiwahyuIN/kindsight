import { Router } from 'express';
import { RequestError, entities, validateId, validateBody, validateQuery } from '../services/fundraising-validation.js';

export function createFundraisingRouter(repository) {
  const router = Router();
  const repo=request=>repository(request.user.organization.id);
  const revision = request => {
    const value=request.get('If-Match');
    if(value===undefined)return undefined; // Compatibility for the legacy Pug client.
    if(!/^"[1-9]\d*"$/.test(value)||!Number.isSafeInteger(Number(value.slice(1,-1))))throw new RequestError(400,'INVALID_REVISION','Send a valid record revision.');
    return Number(value.slice(1,-1));
  };
  // Register explicit routes to keep identifiers entirely separate from request input.
  for (const entity of Object.keys(entities)) {
    router.get(`/${entity}`, async (request,response) => response.json(await repo(request).list(entity,validateQuery(entity,request.query))));
    router.get(`/${entity}/:id`, async (request,response) => response.json({data:await repo(request).get(entity,validateId(request.params.id))}));
    router.post(`/${entity}`, async (request,response) => {
      const input = validateBody(entity,request.body);
      const data = await repo(request).mutate(entity,null,input,'create');
      response.status(201).json({data});
    });
    router.patch(`/${entity}/:id`, async (request,response) => {
      const id = validateId(request.params.id);
      const input = validateBody(entity,request.body,true);
      response.json({data:await repo(request).mutate(entity,id,input,'update',revision(request))});
    });
    router.delete(`/${entity}/:id`, async (request,response) => {
      await repo(request).mutate(entity,validateId(request.params.id),null,'archive',revision(request));
      response.status(204).end();
    });
    router.post(`/${entity}/:id/restore`, async (request,response) => response.json({data:await repo(request).mutate(entity,validateId(request.params.id),null,'restore',revision(request))}));
  }
  return router;
}
