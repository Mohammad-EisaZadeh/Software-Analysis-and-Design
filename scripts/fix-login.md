# Fix "Invalid Credentials" Error

## Quick Fix

### Step 1: Check if Database is Seeded

```bash
# Check if users exist in database
docker compose exec auth-service node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'auth-db',
  database: 'auth_db',
  user: 'postgres',
  password: 'postgres',
});
pool.query('SELECT email, role FROM users')
  .then(r => { console.log('Users:', r.rows); process.exit(0); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
"
```

### Step 2: Seed the Database

```bash
# Run seed script
docker compose exec auth-service npm run seed
```

### Step 3: Verify Users Were Created

```bash
# List all users
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT email, role FROM users;"
```

## Alternative: Register a New User

If seeding doesn't work, register a new user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "student@university.edu",
    "password": "password123",
    "role": "student",
    "tenantId": "tenant-1"
  }'
```

Then login with:
- Email: `student@university.edu`
- Password: `password123`

## Common Issues

### Issue 1: Database Not Ready

**Symptom**: Connection errors in logs

**Fix**:
```bash
# Wait for database to be ready
docker compose ps

# Check database health
docker compose exec auth-db pg_isready -U postgres

# Restart if needed
docker compose restart auth-db auth-service
```

### Issue 2: Seed Script Failed

**Symptom**: Seed script runs but no users created

**Fix**:
```bash
# Check seed script logs
docker compose logs auth-service | grep -i seed

# Manually insert user
docker compose exec auth-db psql -U postgres -d auth_db -c "
INSERT INTO users (name, email, password_hash, role, tenant_id) 
VALUES ('Test User', 'test@university.edu', '\$2b\$10\$rQ8K8K8K8K8K8K8K8K8KuK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'student', 'tenant-1')
ON CONFLICT (email) DO NOTHING;
"
```

### Issue 3: Wrong Password Hash

**Symptom**: User exists but password doesn't match

**Fix**: Re-seed with correct password:
```bash
# Delete existing users
docker compose exec auth-db psql -U postgres -d auth_db -c "DELETE FROM users;"

# Re-seed
docker compose exec auth-service npm run seed
```

### Issue 4: Service Not Connected to Database

**Symptom**: Service running but can't connect to DB

**Fix**:
```bash
# Check service logs
docker compose logs auth-service

# Verify environment variables
docker compose exec auth-service env | grep DB_

# Restart service
docker compose restart auth-service
```

## Test Login Directly

```bash
# Test login via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "student@university.edu",
    "role": "student",
    "tenantId": "tenant-1"
  }
}
```

## Reset Everything

If nothing works, reset and start fresh:

```bash
# Stop everything
docker compose down -v

# Start fresh
docker compose up -d

# Wait for services
sleep 10

# Seed databases
./scripts/seed-all.sh
```




