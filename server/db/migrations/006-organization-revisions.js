export const id='006-organization-revisions';
export async function up(connection){
 const [columns]=await connection.query("SHOW COLUMNS FROM organizations LIKE 'revision'");
 if(!columns.length)await connection.query('ALTER TABLE organizations ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1');
}
