// Additive, restartable migration. Apply while the API is stopped.
export const id='004-organizations';
export const showcaseOrganizationId='40000000-0000-4000-8000-000000000001';
export async function up(connection){
 await connection.query(`CREATE TABLE IF NOT EXISTS organizations (
  id CHAR(36) PRIMARY KEY,name VARCHAR(160) NOT NULL,active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
 ) ENGINE=InnoDB`);
 await connection.execute('INSERT IGNORE INTO organizations (id,name) VALUES (?,?)',[showcaseOrganizationId,'Kindsight Showcase']);
 async function column(table,name,definition){const[rows]=await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`,[name]);if(!rows.length)await connection.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);}
 async function constraint(table,name,definition){const[rows]=await connection.execute('SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME=?',[table,name]);if(!rows.length)await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} ${definition}`);}
 await column('admins','role',"ENUM('platform_admin','organization_user') NOT NULL DEFAULT 'platform_admin'");
 await column('admins','organization_id','CHAR(36) NULL');
 await constraint('admins','fk_admin_organization','FOREIGN KEY (organization_id) REFERENCES organizations(id)');
 await constraint('admins','ck_account_scope',"CHECK ((role='platform_admin' AND organization_id IS NULL) OR (role='organization_user' AND organization_id IS NOT NULL))");
 for(const table of ['donors','campaigns','donations']){
  await column(table,'organization_id','CHAR(36) NULL');
  await connection.execute(`UPDATE ${table} SET organization_id=? WHERE organization_id IS NULL`,[showcaseOrganizationId]);
 }
 const [[invalid]]=await connection.query(`SELECT COUNT(*) AS total FROM donations n
 LEFT JOIN donors d ON n.donor_id=d.id LEFT JOIN campaigns c ON n.campaign_id=c.id
 WHERE (n.donor_id IS NOT NULL AND (d.id IS NULL OR d.organization_id<>n.organization_id))
 OR (n.campaign_id IS NOT NULL AND (c.id IS NULL OR c.organization_id<>n.organization_id))`);
 if(invalid.total)throw new Error('Resolve cross-organization references before applying constraints.');
 for(const table of ['donors','campaigns','donations']){
  await connection.query(`ALTER TABLE ${table} MODIFY organization_id CHAR(36) NOT NULL`);
  await constraint(table,`fk_${table}_organization`,'FOREIGN KEY (organization_id) REFERENCES organizations(id)');
  await constraint(table,`uq_${table}_organization_id`,'UNIQUE (organization_id,id)');
 }
 await constraint('donations','fk_donation_scoped_donor','FOREIGN KEY (organization_id,donor_id) REFERENCES donors(organization_id,id)');
 await constraint('donations','fk_donation_scoped_campaign','FOREIGN KEY (organization_id,campaign_id) REFERENCES campaigns(organization_id,id)');
 const[indexes]=await connection.query("SHOW INDEX FROM donations WHERE Key_name='organization_reporting'");
 if(!indexes.length)await connection.query('CREATE INDEX organization_reporting ON donations(organization_id,status,archived_at,received_at)');
}
