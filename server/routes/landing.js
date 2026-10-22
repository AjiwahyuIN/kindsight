import { Router } from 'express';
import { landingKeys,validateLanding } from '../../shared/landing-content.js';
import { RequestError } from '../services/fundraising-validation.js';
export function createLandingRouter(repository,admin=false,logos) {
  const router=Router();
  router.param('section',(request,response,next,section)=>{
    if(!Object.hasOwn(landingKeys,section))return next(new RequestError(404,'NOT_FOUND','Content section not found.'));
    next();
  });
  router.get('/:section',async(request,response)=>response.json(await repository.get(request.params.section)));
  if(admin)router.put('/:section',async(request,response)=>{
    const body=request.body;
    if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).some(key=>!['content','revision'].includes(key))||!/^[a-f0-9]{64}$/.test(body.revision??''))throw new RequestError(400,'INVALID_INPUT','Send content and its current revision.');
    const {value,fields}=validateLanding(request.params.section,body.content,logos&&request.params.section==='partners'?await logos.list():undefined);
    if(Object.keys(fields).length)throw new RequestError(400,'INVALID_CONTENT','Please correct the highlighted content fields.',fields);
    response.json(await repository.update(request.params.section,value,body.revision));
  });
  return router;
}
