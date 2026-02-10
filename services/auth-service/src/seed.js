const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'auth-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    const tenantId = 'tenant-1';

    const users = [
      { name: 'Admin User', email: 'admin@university.edu', role: 'admin', passwordHash },
      { name: 'John Doe', email: 'student@university.edu', role: 'student', passwordHash },
      { name: 'Dr. Jane Smith', email: 'professor@university.edu', role: 'professor', passwordHash },
      { name: 'Seller One', email: 'seller@university.edu', role: 'seller', passwordHash },
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [user.name, user.email, user.passwordHash, user.role, tenantId]
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





