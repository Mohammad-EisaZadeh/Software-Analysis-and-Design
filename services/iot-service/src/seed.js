const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'iot-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'iot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const tenantId = 'tenant-1';
    const sensors = ['temp-001', 'temp-002', 'humidity-001', 'light-001'];

    for (const sensorId of sensors) {
      let value;
      if (sensorId.startsWith('temp')) {
        value = (Math.random() * 30 + 15).toFixed(2);
      } else if (sensorId.startsWith('humidity')) {
        value = (Math.random() * 50 + 30).toFixed(2);
      } else {
        value = (Math.random() * 1000).toFixed(2);
      }

      await pool.query(
        'INSERT INTO sensor_readings (sensor_id, value, tenant_id) VALUES ($1, $2, $3)',
        [sensorId, value, tenantId]
      );
    }

    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();





