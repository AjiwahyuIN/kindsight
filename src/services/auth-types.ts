export type UserRole='platform_admin'|'organization_user';
export type SessionUser={id:string;name:string;email:string}&({role:'platform_admin';organization:null}|{role:'organization_user';organization:{id:string;name:string}});
// Compatibility for the isolated mock fixtures; active code uses SessionUser.
export type AdminAccount=SessionUser;
export type SignInInput={email:string;password:string};
