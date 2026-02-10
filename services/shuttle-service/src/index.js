const express = require('express');
const { Pool } = require('pg');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

const pool = new Pool({
  host: process.env.DB_HOST || 'shuttle-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shuttle_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS shuttle_locations (
        id SERIAL PRIMARY KEY,
        shuttle_id VARCHAR(255) NOT NULL,
        lat DECIMAL(10,8) NOT NULL,
        lng DECIMAL(11,8) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tenant_id VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_shuttle_locations_shuttle ON shuttle_locations(shuttle_id);
      CREATE INDEX IF NOT EXISTS idx_shuttle_locations_tenant ON shuttle_locations(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_shuttle_locations_timestamp ON shuttle_locations(timestamp DESC);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

// Simulate shuttle movement every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    const shuttles = ['shuttle-001', 'shuttle-002', 'shuttle-003'];
    const tenantId = 'tenant-1';

    // University campus approximate coordinates
    const baseLat = 40.7128;
    const baseLng = -74.0060;

    for (const shuttleId of shuttles) {
      // Get last location or use base
      const lastLocation = await pool.query(
        'SELECT lat, lng FROM shuttle_locations WHERE shuttle_id = $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT 1',
        [shuttleId, tenantId]
      );

      let lat, lng;
      if (lastLocation.rows.length > 0) {
        // Move slightly from last position
        lat = parseFloat(lastLocation.rows[0].lat) + (Math.random() - 0.5) * 0.001;
        lng = parseFloat(lastLocation.rows[0].lng) + (Math.random() - 0.5) * 0.001;
      } else {
        // Start from base with small random offset
        lat = baseLat + (Math.random() - 0.5) * 0.01;
        lng = baseLng + (Math.random() - 0.5) * 0.01;
      }

      await pool.query(
        'INSERT INTO shuttle_locations (shuttle_id, lat, lng, tenant_id) VALUES ($1, $2, $3, $4)',
        [shuttleId, lat.toFixed(8), lng.toFixed(8), tenantId]
      );
    }

    console.log('Shuttle locations updated');
  } catch (error) {
    console.error('Error updating shuttle locations:', error);
  }
});

app.use(cors());
app.use(express.json());

const extractUserInfo = (req, res, next) => {
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// GET /shuttle/:id/location
app.get('/shuttle/:id/location', extractUserInfo, async (req, res) => {
  try {
    const shuttleId = req.params.id;
    const tenantId = req.tenantId || 'tenant-1';

    const result = await pool.query(
      'SELECT * FROM shuttle_locations WHERE shuttle_id = $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT 1',
      [shuttleId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shuttle location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get shuttle location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /shuttles (all shuttles)
app.get('/shuttles', extractUserInfo, async (req, res) => {
  try {
    const tenantId = req.tenantId || 'tenant-1';

    const result = await pool.query(
      `SELECT DISTINCT ON (shuttle_id) 
       shuttle_id, lat, lng, timestamp 
       FROM shuttle_locations 
       WHERE tenant_id = $1 
       ORDER BY shuttle_id, timestamp DESC`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get shuttles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shuttle-service' });
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shuttle service running on port ${PORT}`);
  });
});





