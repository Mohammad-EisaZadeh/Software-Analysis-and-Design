const express = require('express');
const { Pool } = require('pg');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

const pool = new Pool({
  host: process.env.DB_HOST || 'iot-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'iot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        sensor_id VARCHAR(255) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tenant_id VARCHAR(255) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id);
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_tenant ON sensor_readings(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

// Simulate sensor data every minute
cron.schedule('* * * * *', async () => {
  try {
    const sensors = ['temp-001', 'temp-002', 'humidity-001', 'light-001'];
    const tenantId = 'tenant-1';

    for (const sensorId of sensors) {
      let value;
      if (sensorId.startsWith('temp')) {
        value = (Math.random() * 30 + 15).toFixed(2); // 15-45°C
      } else if (sensorId.startsWith('humidity')) {
        value = (Math.random() * 50 + 30).toFixed(2); // 30-80%
      } else {
        value = (Math.random() * 1000).toFixed(2); // 0-1000 lux
      }

      await pool.query(
        'INSERT INTO sensor_readings (sensor_id, value, tenant_id) VALUES ($1, $2, $3)',
        [sensorId, value, tenantId]
      );
    }

    console.log('Sensor data simulated');
  } catch (error) {
    console.error('Error simulating sensor data:', error);
  }
});

app.use(cors());
app.use(express.json());

const extractUserInfo = (req, res, next) => {
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// GET /sensors/:id/latest
app.get('/sensors/:id/latest', extractUserInfo, async (req, res) => {
  try {
    const sensorId = req.params.id;
    const tenantId = req.tenantId || 'tenant-1';

    const result = await pool.query(
      'SELECT * FROM sensor_readings WHERE sensor_id = $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT 1',
      [sensorId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor reading not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get sensor reading error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /sensors/:id/history
app.get('/sensors/:id/history', extractUserInfo, async (req, res) => {
  try {
    const sensorId = req.params.id;
    const tenantId = req.tenantId || 'tenant-1';
    const limit = parseInt(req.query.limit) || 100;

    const result = await pool.query(
      'SELECT * FROM sensor_readings WHERE sensor_id = $1 AND tenant_id = $2 ORDER BY timestamp DESC LIMIT $3',
      [sensorId, tenantId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sensor history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'iot-service' });
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IoT service running on port ${PORT}`);
  });
});





