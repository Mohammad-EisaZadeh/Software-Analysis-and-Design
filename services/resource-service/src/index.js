const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

const pool = new Pool({
  host: process.env.DB_HOST || 'resource-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resource_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    // Enable btree_gist extension for exclusion constraints
    await client.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create bookings table with exclusion constraint
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create exclusion constraint if it doesn't exist
    const constraintExists = await client.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'no_overlap'
    `);
    
    if (constraintExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE bookings 
        ADD CONSTRAINT no_overlap 
        EXCLUDE USING gist (
          resource_id WITH =,
          tsrange(start_time, end_time) WITH &&
        ) WHERE (status = 'confirmed')
      `);
    }
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_tenant ON resources(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_resource ON bookings(resource_id);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json());

const extractUserInfo = (req, res, next) => {
  req.userId = parseInt(req.headers['x-user-id']);
  req.userRole = req.headers['x-role'];
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// GET /resources
app.get('/resources', extractUserInfo, async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM resources WHERE tenant_id = $1';
    const params = [req.tenantId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /resources (admin/manager only)
app.post('/resources', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { name, type, capacity } = req.body;

    if (!name || !type || !capacity) {
      return res.status(400).json({ error: 'Name, type, and capacity are required' });
    }

    const result = await pool.query(
      'INSERT INTO resources (name, type, capacity, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, capacity, req.tenantId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /bookings
app.post('/bookings', extractUserInfo, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { resourceId, startTime, endTime } = req.body;

    if (!resourceId || !startTime || !endTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Resource ID, start time, and end time are required' });
    }

    // Check resource exists and belongs to tenant
    const resource = await client.query(
      'SELECT * FROM resources WHERE id = $1 AND tenant_id = $2',
      [resourceId, req.tenantId]
    );

    if (resource.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Check for overlapping bookings (concurrency control)
    const overlapping = await client.query(
      `SELECT id FROM bookings 
       WHERE resource_id = $1 
       AND status = 'confirmed'
       AND tenant_id = $2
       AND tsrange($3::timestamp, $4::timestamp) && tsrange(start_time, end_time)`,
      [resourceId, req.tenantId, startTime, endTime]
    );

    if (overlapping.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Resource is already booked for this time slot' });
    }

    // Create booking
    const result = await client.query(
      'INSERT INTO bookings (resource_id, user_id, start_time, end_time, status, tenant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [resourceId, req.userId, startTime, endTime, 'confirmed', req.tenantId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    if (error.code === '23P01') { // Exclusion constraint violation
      return res.status(409).json({ error: 'Resource is already booked for this time slot' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /bookings/my
app.get('/bookings/my', extractUserInfo, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, r.name as resource_name, r.type as resource_type 
       FROM bookings b
       JOIN resources r ON b.resource_id = r.id
       WHERE b.user_id = $1 AND b.tenant_id = $2
       ORDER BY b.start_time DESC`,
      [req.userId, req.tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'resource-service' });
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resource service running on port ${PORT}`);
  });
});

