const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'marketplace-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'marketplace_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const tenantId = 'tenant-1';

    // Create seller
    const sellerResult = await pool.query(
      'INSERT INTO sellers (name, tenant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
      ['University Store', tenantId]
    );

    let sellerId;
    if (sellerResult.rows.length > 0) {
      sellerId = sellerResult.rows[0].id;
    } else {
      const existing = await pool.query('SELECT id FROM sellers WHERE tenant_id = $1', [tenantId]);
      sellerId = existing.rows[0].id;
    }

    const products = [
      { name: 'Notebook', price: 5.99, stock: 100 },
      { name: 'Pen Set', price: 3.50, stock: 200 },
      { name: 'Calculator', price: 25.00, stock: 50 },
      { name: 'Textbook', price: 49.99, stock: 30 },
    ];

    for (const product of products) {
      await pool.query(
        'INSERT INTO products (seller_id, name, price, stock, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [sellerId, product.name, product.price, product.stock, tenantId]
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





