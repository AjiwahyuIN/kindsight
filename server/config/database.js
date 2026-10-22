import mysql from 'mysql2/promise';

export function createDatabasePool(config) {
  const pool = mysql.createPool(config);
  pool.on('connection', connection => {
    // Align SQL timestamps with the UTC connection serializer.
    connection.query("SET time_zone = '+00:00'");
  });
  return pool;
}
