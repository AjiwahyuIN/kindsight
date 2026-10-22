export const id='005-demo-request-revisions';
export async function up(connection){
 const [columns]=await connection.query("SHOW COLUMNS FROM demo_requests LIKE 'revision'");
 if(!columns.length)await connection.query('ALTER TABLE demo_requests ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1');
 const [indexes]=await connection.query("SHOW INDEX FROM demo_requests WHERE Key_name='demo_status_created'");
 if(!indexes.length)await connection.query('CREATE INDEX demo_status_created ON demo_requests(status,created_at,id)');
}
