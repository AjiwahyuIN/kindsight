export function createAuthRepository(pool) {
 const projection='a.id,a.name,a.email,a.active,a.role,a.organization_id,o.name AS organization_name,o.active AS organization_active';
 const allowed="a.active=TRUE AND (a.role='platform_admin' OR (a.role='organization_user' AND o.active=TRUE))";
 return {
  async findAdmin(email){const [[user]]=await pool.execute(`SELECT ${projection},a.password_hash FROM admins a LEFT JOIN organizations o ON o.id=a.organization_id WHERE a.email=?`,[email]);return user;},
  async saveSession({hash,adminId,expiresAt}){
   const db=await pool.getConnection();
   try{
    await db.beginTransaction();
    const [[scope]]=await db.execute('SELECT organization_id FROM admins WHERE id=?',[adminId]);
    // Lock the organization first, in the same order as administrative deactivation.
    const [[organization]]=scope?.organization_id?await db.execute('SELECT active FROM organizations WHERE id=? FOR UPDATE',[scope.organization_id]):[[]];
    const [[account]]=await db.execute('SELECT active,role,organization_id FROM admins WHERE id=? FOR UPDATE',[adminId]);
    if(!account?.active||account.organization_id!==scope?.organization_id||(account.role==='organization_user'&&!organization?.active)){
     await db.rollback();return false;
    }
    await db.execute('INSERT INTO sessions (session_id,admin_id,expires_at,data) VALUES (?,?,?,?)',[hash,adminId,expiresAt,'{}']);await db.commit();return true;
   }catch(error){await db.rollback();throw error;}finally{db.release();}
  },
  async findSession(hash){
   // Revoke all sessions of inactive accounts/organizations, not only the presented token.
   await pool.query(`DELETE s FROM sessions s JOIN admins a ON a.id=s.admin_id LEFT JOIN organizations o ON o.id=a.organization_id WHERE NOT (${allowed})`);
   const [[user]]=await pool.execute(`SELECT ${projection} FROM sessions s JOIN admins a ON a.id=s.admin_id LEFT JOIN organizations o ON o.id=a.organization_id WHERE s.session_id=? AND s.expires_at>UTC_TIMESTAMP(3) AND ${allowed}`,[hash]);return user;
  },
  async deleteSession(hash){await pool.execute('DELETE FROM sessions WHERE session_id=?',[hash]);},
  async pruneSessions(){await pool.query(`DELETE s FROM sessions s JOIN admins a ON a.id=s.admin_id LEFT JOIN organizations o ON o.id=a.organization_id WHERE s.expires_at<=UTC_TIMESTAMP(3) OR NOT (${allowed})`);},
 };
}
