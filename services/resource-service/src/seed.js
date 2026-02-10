const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'resource-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resource_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const tenantId = 'tenant-1';

    const resources = [
      { name: 'Conference Room A', type: 'room', capacity: 20 },
      { name: 'Conference Room B', type: 'room', capacity: 10 },
      { name: 'Lab 101', type: 'lab', capacity: 30 },
      { name: 'Auditorium', type: 'auditorium', capacity: 200 },
    ];

    for (const resource of resources) {
      await pool.query(
        'INSERT INTO resources (name, type, capacity, tenant_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [resource.name, resource.type, resource.capacity, tenantId]
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





