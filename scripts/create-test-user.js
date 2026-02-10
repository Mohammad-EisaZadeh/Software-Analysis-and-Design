// Quick script to create a test user
// Run with: docker compose exec auth-service node scripts/create-test-user.js

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'auth-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createTestUser() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    const tenantId = 'tenant-1';

    const users = [
      { name: 'Admin User', email: 'admin@university.edu', role: 'admin' },
      { name: 'John Doe', email: 'student@university.edu', role: 'student' },
      { name: 'Dr. Jane Smith', email: 'professor@university.edu', role: 'professor' },
      { name: 'Seller One', email: 'seller@university.edu', role: 'seller' },
    ];

    console.log('Creating test users...');

    for (const user of users) {
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = $3 RETURNING id, email, role',
        [user.name, user.email, passwordHash, user.role, tenantId]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created/Updated: ${user.email} (${user.role})`);
      }
    }

    // Verify
    const allUsers = await pool.query('SELECT email, role FROM users ORDER BY email');
    console.log('\n📋 All users in database:');
    allUsers.rows.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });

    console.log('\n✅ Test users ready!');
    console.log('Login with: student@university.edu / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();




