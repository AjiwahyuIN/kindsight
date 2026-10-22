import type { Router } from 'express';
import type { createAuthRepository } from './repositories/auth.js';
import type { createFundraisingRepository } from './repositories/fundraising.js';
import type { createDashboardRepository } from './repositories/dashboard.js';
import type { createLandingRepository } from './repositories/landing.js';
import type { createPartnerLogoRepository } from './repositories/partner-logos.js';
export type AppOptions={users?:Router;organizations?:Router;demoRequests?:{public:Router;admin:Router};overview?:Router;auth?:{repository:ReturnType<typeof createAuthRepository>;origins:string[];secureCookie?:boolean;loginLimit?:number};fundraising?:(organizationId:string)=>ReturnType<typeof createFundraisingRepository>;dashboard?:(organizationId:string)=>ReturnType<typeof createDashboardRepository>;landing?:ReturnType<typeof createLandingRepository>;logos?:ReturnType<typeof createPartnerLogoRepository>;logoStorage?:string;content?:{public:Router;admin:Router};checkDatabase?:()=>Promise<void>};
