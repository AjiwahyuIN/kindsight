export const id='007-account-revisions';
export async function up(connection){
 const [columns]=await connection.query("SHOW COLUMNS FROM admins LIKE 'revision'");
 if(!columns.length)await connection.query('ALTER TABLE admins ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1');
}
