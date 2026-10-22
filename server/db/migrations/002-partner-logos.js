export const id = '002-partner-logos';
export async function up(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS partner_logos (
    id VARCHAR(60) PRIMARY KEY, name VARCHAR(100) NOT NULL,
    file_name VARCHAR(80) NOT NULL UNIQUE,
    width INT UNSIGNED NOT NULL, height INT UNSIGNED NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB`);
}
