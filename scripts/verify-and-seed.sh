#!/bin/bash

echo "🔍 Verifying and seeding auth database..."

# Check if auth-service is running
if ! docker compose ps auth-service | grep -q "Up"; then
    echo "❌ Auth service is not running. Start it first with: docker compose up"
    exit 1
fi

# Wait a bit for service to be ready
sleep 2

# Check database connection
echo "📊 Checking database connection..."
docker compose exec -T auth-service node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'auth-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.query('SELECT COUNT(*) FROM users')
  .then(result => {
    console.log('✅ Database connected. Users in DB:', result.rows[0].count);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });
"

# Seed the database
echo ""
echo "🌱 Seeding database..."
docker compose exec -T auth-service npm run seed

# Verify users were created
echo ""
echo "👥 Verifying users..."
docker compose exec -T auth-service node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'auth-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.query('SELECT email, role FROM users ORDER BY email')
  .then(result => {
    console.log('Users in database:');
    result.rows.forEach(user => {
      console.log('  -', user.email, '(' + user.role + ')');
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
"

echo ""
echo "✅ Done! You can now login with:"
echo "   Email: student@university.edu"
echo "   Password: password123"




