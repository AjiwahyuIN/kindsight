import mysql from 'mysql2/promise';
import { readConfig } from '../config/env.js';

// Explicit provisioning step. The runtime never connects with the administrator account.
let connection;
try {
  const { database } = readConfig();
  connection = await mysql.createConnection({
    host: database.host, port: database.port,
    user: process.env.MYSQL_ADMIN_USER || 'root', password: process.env.MYSQL_ADMIN_PASSWORD || '',
    connectTimeout: 3000, multipleStatements: false,
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [database.database]);
  await connection.query("CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?", [database.user, database.password]);
  await connection.query("GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON ??.* TO ?@'localhost'", [database.database, database.user]);
  console.log('Local application database and scoped account provisioned. Existing credentials are not overwritten.');
} catch (error) {
  console.error('Database setup failed:', error.code || error.message);
  process.exitCode = 1;
} finally { await connection?.end(); }
