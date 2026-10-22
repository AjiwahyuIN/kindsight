import {Router} from 'express';
import type {Pool,RowDataPacket} from 'mysql2/promise';
// Operational metadata only: never query an organization's financial ledger.
export function createAdminOverviewRouter(pool:Pool){
 const router=Router();
 router.get('/',async(_request,response,next)=>{
  try{
   const [[row]]=await pool.execute<RowDataPacket[]>(`SELECT
    (SELECT COUNT(*) FROM organizations) AS organizations,
    (SELECT COUNT(*) FROM organizations WHERE active=TRUE) AS activeOrganizations,
    (SELECT COUNT(*) FROM admins WHERE role='organization_user') AS accounts,
    (SELECT COUNT(*) FROM admins a JOIN organizations o ON o.id=a.organization_id WHERE a.role='organization_user' AND a.active=TRUE AND o.active=TRUE) AS enabledAccounts,
    (SELECT COUNT(*) FROM landing_sections WHERE section_key IN ('navigation','hero','partners','difference','about','solutions','testimonial','missions','sectors','footer')) AS sections`);
   response.json({data:{organizations:{total:Number(row.organizations),active:Number(row.activeOrganizations)},organizationAccounts:{total:Number(row.accounts),enabled:Number(row.enabledAccounts)},landingSections:Number(row.sections),updatedAt:new Date().toISOString()}});
  }catch(error){next(error);}
 });
 return router;
}
