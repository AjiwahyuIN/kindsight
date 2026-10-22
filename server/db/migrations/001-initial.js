export const id = '001-initial';

export async function up(connection) {
  const timestamps = 'created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)';
  const tables = [
    `CREATE TABLE IF NOT EXISTS seed_runs (
      id VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS admins (
      id CHAR(36) PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL, name VARCHAR(120) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE, ${timestamps}
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(128) PRIMARY KEY, admin_id CHAR(36) NOT NULL,
      expires_at DATETIME(3) NOT NULL, data JSON NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admins(id), INDEX (expires_at)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS donors (
      id CHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL,
      email VARCHAR(254), phone VARCHAR(40), organization VARCHAR(160),
      archived_at DATETIME(3), ${timestamps}, INDEX (name)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS campaigns (
      id CHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, description TEXT NOT NULL,
      target_amount DECIMAL(15,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'USD',
      starts_on DATE, ends_on DATE, status ENUM('draft','active','completed') NOT NULL DEFAULT 'draft',
      archived_at DATETIME(3), ${timestamps},
      CHECK (target_amount >= 0), CHECK (currency = 'USD'),
      CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS donations (
      id CHAR(36) PRIMARY KEY, donor_id CHAR(36), campaign_id CHAR(36),
      amount DECIMAL(15,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'USD',
      status ENUM('pending','received','cancelled') NOT NULL DEFAULT 'pending',
      received_at DATETIME(3), expected_at DATETIME(3), note TEXT,
      archived_at DATETIME(3), ${timestamps},
      FOREIGN KEY (donor_id) REFERENCES donors(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      CHECK (amount > 0), CHECK (currency = 'USD'),
      CHECK (status <> 'received' OR received_at IS NOT NULL),
      INDEX donation_reporting (status, archived_at, received_at), INDEX (campaign_id, received_at)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS landing_sections (
      section_key VARCHAR(60) PRIMARY KEY, content_json JSON NOT NULL, ${timestamps}
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id CHAR(36) PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
      status ENUM('subscribed','unsubscribed') NOT NULL DEFAULT 'subscribed', ${timestamps}
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS demo_requests (
      id CHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL, email VARCHAR(254) NOT NULL,
      organization VARCHAR(160), message TEXT,
      status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new', ${timestamps}
    ) ENGINE=InnoDB`,
  ];
  // MySQL DDL commits implicitly. Every CREATE is restartable; the migration is recorded only after all succeed.
  for (const sql of tables) await connection.query(sql);
}
