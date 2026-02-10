const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;

const pool = new Pool({
  host: process.env.DB_HOST || 'notification-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'notification_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

let rabbitChannel;

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

const initRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('order_events', { durable: true });

    // Consume order events
    rabbitChannel.consume('order_events', async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          if (event.type === 'order_completed') {
            await pool.query(
              'INSERT INTO notifications (user_id, message, tenant_id) VALUES ($1, $2, $3)',
              [
                event.userId,
                `Your order #${event.orderId} has been confirmed. Total: $${event.total}`,
                event.tenantId,
              ]
            );
            console.log(`Notification created for order ${event.orderId}`);
          }
          rabbitChannel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          rabbitChannel.nack(msg, false, false);
        }
      }
    });

    console.log('RabbitMQ connected and consuming messages');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
  }
};

app.use(cors());
app.use(express.json());

// POST /notify
app.post('/notify', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'tenant-1';

    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }

    const result = await pool.query(
      'INSERT INTO notifications (user_id, message, tenant_id) VALUES ($1, $2, $3) RETURNING *',
      [userId, message, tenantId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notifications (for user)
app.get('/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const tenantId = req.headers['x-tenant-id'] || 'tenant-1';

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [userId, tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

Promise.all([initDB(), initRabbitMQ()]).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Notification service running on port ${PORT}`);
  });
});





