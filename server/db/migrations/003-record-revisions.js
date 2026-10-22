export const id='003-record-revisions';
export async function up(connection){
 for(const table of ['donors','campaigns','donations']) {
  const [columns]=await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'revision'`);
  if(!columns.length)await connection.query(`ALTER TABLE ${table} ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1`);
 }
}
