import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export function readConfig(source = process.env) {
  const port = (key, fallback) => {
    const value = Number(source[key] ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${key} must be a valid port.`);
    return value;
  };
  const database = source.DB_NAME || 'kindsight_local';
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('DB_NAME must contain only letters, numbers, and underscores.');
  if (!source.DB_PASSWORD || source.DB_PASSWORD === 'replace-with-a-local-password') throw new Error('Set DB_PASSWORD in the local .env file.');
  return {
    host: source.API_HOST || '127.0.0.1', port: port('API_PORT', 3101),
    auth: {
      origins: (source.APP_ORIGINS || 'http://127.0.0.1:5175,http://localhost:5175,http://127.0.0.1:5173,http://localhost:5173').split(',').map(value => value.trim()).concat(source.NODE_ENV === 'production' ? [] : ['http://127.0.0.1:5176','http://localhost:5176','http://127.0.0.1:5180','http://localhost:5180']),
      secureCookie: source.NODE_ENV === 'production',
    },
    database: {
      host: source.DB_HOST || '127.0.0.1', port: port('DB_PORT', 3306),
      database, user: source.DB_USER || 'kindsight_app', password: source.DB_PASSWORD,
      connectionLimit: 5, waitForConnections: true, queueLimit: 20,
      connectTimeout: 3000, timezone: 'Z', dateStrings: true,
      decimalNumbers: false, charset: 'utf8mb4', multipleStatements: false,
    },
  };
}
