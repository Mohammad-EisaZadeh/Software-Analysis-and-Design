const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'shuttle-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shuttle_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const tenantId = 'tenant-1';
    const shuttles = ['shuttle-001', 'shuttle-002', 'shuttle-003'];
    const baseLat = 40.7128;
    const baseLng = -74.0060;

    for (const shuttleId of shuttles) {
      const lat = baseLat + (Math.random() - 0.5) * 0.01;
      const lng = baseLng + (Math.random() - 0.5) * 0.01;

      await pool.query(
        'INSERT INTO shuttle_locations (shuttle_id, lat, lng, tenant_id) VALUES ($1, $2, $3, $4)',
        [shuttleId, lat.toFixed(8), lng.toFixed(8), tenantId]
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





