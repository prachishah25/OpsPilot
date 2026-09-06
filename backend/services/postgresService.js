const { Pool } = require('pg');

const pool = new Pool({
  host:
    process.env.POSTGRES_HOST ||
    'postgres',

  port:
    Number(
      process.env.POSTGRES_PORT ||
      5432
    ),

  database:
    process.env.POSTGRES_DB ||
    'opspilot',

  user:
    process.env.POSTGRES_USER ||
    'opspilot',

  password:
    process.env.POSTGRES_PASSWORD ||
    'opspilot_dev_password',
});

const initializePostgres =
  async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_events (
        id BIGSERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        incident_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        incident_status VARCHAR(50),
        incident_priority VARCHAR(50),
        source VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_events_user_id
      ON incident_events(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id
      ON incident_events(incident_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_events_created_at
      ON incident_events(created_at);
    `);

    console.log(
      'PostgreSQL analytics initialized'
    );
  };

const recordIncidentEvent =
  async ({
    userId,
    incidentId,
    eventType,
    status = null,
    priority = null,
    source = null,
  }) => {
    console.log(
      'POSTGRES EVENT:',
      {
        userId,
        incidentId,
        eventType,
        status,
        priority,
        source,
      }
    );

    try {
      await pool.query(
        `
          INSERT INTO incident_events (
            user_id,
            incident_id,
            event_type,
            incident_status,
            incident_priority,
            source
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          );
        `,
        [
          String(userId),
          String(incidentId),
          eventType,
          status,
          priority,
          source,
        ]
      );

      console.log(
        '✅ PostgreSQL analytics event recorded:',
        eventType
      );
    } catch (error) {
      console.error(
        '❌ Failed to record PostgreSQL analytics event:'
      );
      console.error(error);
    }
  };

module.exports = {
  pool,
  initializePostgres,
  recordIncidentEvent,
};