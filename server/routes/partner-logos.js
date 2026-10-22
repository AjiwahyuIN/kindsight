import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir,writeFile,unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { RequestError } from '../services/fundraising-validation.js';

export const logoDirectory=fileURLToPath(new URL('../storage/partner-logos/',import.meta.url));
const formats={'image/png':'png','image/jpeg':'jpeg','image/webp':'webp'};
const invalid=()=>new RequestError(400,'INVALID_LOGO','Choose a valid, static PNG, JPG or WebP image (maximum 2 MB and 16 megapixels).');
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1,fields:1,fieldSize:400,parts:2},fileFilter(request,file,done){done(formats[file.mimetype]?null:invalid(),Boolean(formats[file.mimetype]));}}).single('logo');
export function createPartnerLogoRouter(repository,{admin=false,directory=logoDirectory}={}) {
  const router=Router();
  if(!admin){
    router.get('/',async(request,response)=>response.json({data:await repository.list()}));
    router.get('/:id/file',async(request,response)=>{
      if(!/^upload-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(request.params.id))throw new RequestError(404,'NOT_FOUND','Logo not found.');
      const logo=await repository.get(request.params.id);
      if(!logo||logo.file_name!==`${request.params.id}.png`)throw new RequestError(404,'NOT_FOUND','Logo not found.');
      response.set('X-Content-Type-Options','nosniff');
      response.sendFile(path.resolve(directory,logo.file_name),error=>{
        if(error&&!response.headersSent)response.status(404).json({error:{code:'NOT_FOUND',message:'Logo file unavailable.'}});
      });
    });
    return router;
  }
  router.post('/',(request,response,next)=>upload(request,response,error=>{
    if(error)return next(error instanceof multer.MulterError?new RequestError(error.code==='LIMIT_FILE_SIZE'?413:400,'INVALID_UPLOAD','Upload one image up to 2 MB with an organization name.'):error);
    next();
  }),async(request,response)=>{
    const name=typeof request.body?.name==='string'?request.body.name.trim():null;
    if(typeof name!=='string'||!name||name.length>100||/[\u0000-\u001f\u007f]/u.test(name)||Object.keys(request.body).some(key=>key!=='name'))throw new RequestError(400,'INVALID_NAME','Enter an organization name of 1–100 characters.');
    if(!request.file)throw invalid();
    let result;
    try {
      const image=sharp(request.file.buffer,{limitInputPixels:16_000_000,failOn:'error'});
      const metadata=await image.metadata();
      if(metadata.format!==formats[request.file.mimetype]||(metadata.pages??1)!==1)throw invalid();
      result=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).png().toBuffer({resolveWithObject:true});
    }catch{throw invalid();}
    const id=`upload-${randomUUID()}`,file_name=`${id}.png`,target=path.resolve(directory,file_name);
    await mkdir(directory,{recursive:true});
    await writeFile(target,result.data,{flag:'wx'});
    try {
      const logo=await repository.create({id,name,file_name,width:result.info.width,height:result.info.height});
      response.status(201).json({data:logo});
    }catch(error){await unlink(target).catch(()=>{});throw error;}
  });
  return router;
}
