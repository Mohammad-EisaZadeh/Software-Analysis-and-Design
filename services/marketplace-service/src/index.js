const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

const pool = new Pool({
  host: process.env.DB_HOST || 'marketplace-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'marketplace_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

let rabbitChannel;
let redisClient;

// Initialize RabbitMQ
const initRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue('order_events', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
  }
};

// Initialize Redis
const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });
    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id),
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, tenant_id)
      );
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        saga_id VARCHAR(255),
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS saga_logs (
        id SERIAL PRIMARY KEY,
        saga_id VARCHAR(255) NOT NULL,
        step VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_saga_logs ON saga_logs(saga_id);
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

// Saga: Reserve Stock
const reserveStock = async (client, sagaId, items) => {
  const reservedItems = [];
  for (const item of items) {
    const result = await client.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 AND tenant_id = $3 RETURNING id, name, stock',
      [item.quantity, item.productId, item.tenantId]
    );
    if (result.rows.length === 0) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
    reservedItems.push({ ...result.rows[0], quantity: item.quantity });
  }
  await client.query(
    'INSERT INTO saga_logs (saga_id, step, status, data) VALUES ($1, $2, $3, $4)',
    [sagaId, 'reserve_stock', 'completed', JSON.stringify(reservedItems)]
  );
  return reservedItems;
};

// Saga: Compensate Stock
const compensateStock = async (client, sagaId) => {
  const log = await client.query(
    'SELECT data FROM saga_logs WHERE saga_id = $1 AND step = $2 ORDER BY created_at DESC LIMIT 1',
    [sagaId, 'reserve_stock']
  );
  if (log.rows.length > 0) {
    const items = log.rows[0].data;
    for (const item of items) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }
  }
  await client.query(
    'INSERT INTO saga_logs (saga_id, step, status, data) VALUES ($1, $2, $3, $4)',
    [sagaId, 'compensate_stock', 'completed', JSON.stringify({})]
  );
};

// POST /products (seller only)
app.post('/products', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ error: 'Forbidden: Seller access required' });
    }

    const { name, price, stock } = req.body;

    if (!name || !price || stock === undefined) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    // Get or create seller
    let seller = await pool.query(
      'SELECT id FROM sellers WHERE tenant_id = $1 LIMIT 1',
      [req.tenantId]
    );

    if (seller.rows.length === 0) {
      const newSeller = await pool.query(
        'INSERT INTO sellers (name, tenant_id) VALUES ($1, $2) RETURNING id',
        [`Seller for ${req.tenantId}`, req.tenantId]
      );
      seller = newSeller;
    }

    const result = await pool.query(
      'INSERT INTO products (seller_id, name, price, stock, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [seller.rows[0].id, name, price, stock, req.tenantId]
    );

    // Invalidate cache
    if (redisClient?.isOpen) {
      await redisClient.del(`products:${req.tenantId}`);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /products (with Redis cache)
app.get('/products', extractUserInfo, async (req, res) => {
  try {
    const cacheKey = `products:${req.tenantId}`;

    // Try cache first
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // Query database
    const result = await pool.query(
      'SELECT * FROM products WHERE tenant_id = $1 ORDER BY name',
      [req.tenantId]
    );

    // Cache for 5 minutes
    if (redisClient?.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /cart/items
app.post('/cart/items', extractUserInfo, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

    // Get or create cart
    let cart = await pool.query(
      'SELECT id FROM carts WHERE user_id = $1 AND tenant_id = $2',
      [req.userId, req.tenantId]
    );

    if (cart.rows.length === 0) {
      const newCart = await pool.query(
        'INSERT INTO carts (user_id, tenant_id) VALUES ($1, $2) RETURNING id',
        [req.userId, req.tenantId]
      );
      cart = newCart;
    }

    // Check if item exists in cart
    const existing = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.rows[0].id, productId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
        [quantity, existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cart.rows[0].id, productId, quantity]
      );
    }

    res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /checkout (Saga Pattern)
app.post('/checkout', extractUserInfo, async (req, res) => {
  const client = await pool.connect();
  const sagaId = uuidv4();

  try {
    await client.query('BEGIN');

    // Get cart items
    const cart = await client.query(
      'SELECT id FROM carts WHERE user_id = $1 AND tenant_id = $2',
      [req.userId, req.tenantId]
    );

    if (cart.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cart is empty' });
    }

    const cartItems = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.tenant_id
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart.rows[0].id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cart is empty' });
    }

    // Saga Step 1: Reserve Stock
    try {
      const items = cartItems.rows.map(row => ({
        productId: row.product_id,
        quantity: row.quantity,
        tenantId: row.tenant_id,
      }));
      await reserveStock(client, sagaId, items);
    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: error.message });
    }

    // Saga Step 2: Create Order
    let orderId;
    try {
      const total = cartItems.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total, status, saga_id, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.userId, total, 'pending', sagaId, req.tenantId]
      );
      orderId = orderResult.rows[0].id;

      for (const item of cartItems.rows) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.product_id, item.quantity, item.price]
        );
      }

      await client.query(
        'INSERT INTO saga_logs (saga_id, step, status, data) VALUES ($1, $2, $3, $4)',
        [sagaId, 'create_order', 'completed', JSON.stringify({ orderId })]
      );
    } catch (error) {
      // Compensate: Restore stock
      await compensateStock(client, sagaId);
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Saga Step 3: Confirm Order
    try {
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['confirmed', orderId]
      );

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.rows[0].id]);
      await client.query('DELETE FROM carts WHERE id = $1', [cart.rows[0].id]);

      await client.query(
        'INSERT INTO saga_logs (saga_id, step, status, data) VALUES ($1, $2, $3, $4)',
        [sagaId, 'confirm_order', 'completed', JSON.stringify({ orderId })]
      );

      // Publish event to RabbitMQ
      if (rabbitChannel) {
        rabbitChannel.sendToQueue('order_events', Buffer.from(JSON.stringify({
          type: 'order_completed',
          orderId,
          userId: req.userId,
          tenantId: req.tenantId,
          total: cartItems.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        })));
      }

      // Invalidate cache
      if (redisClient?.isOpen) {
        await redisClient.del(`products:${req.tenantId}`);
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Order placed successfully',
        orderId,
        sagaId,
      });
    } catch (error) {
      // Compensate: Restore stock and cancel order
      await compensateStock(client, sagaId);
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['cancelled', orderId]);
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to confirm order' });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'marketplace-service' });
});

Promise.all([initDB(), initRabbitMQ(), initRedis()]).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marketplace service running on port ${PORT}`);
  });
});





