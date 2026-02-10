# Fix "Invalid Credentials" Login Error

## 🔧 Quick Fix (Most Common Issue)

The database likely hasn't been seeded yet. Follow these steps:

### Step 1: Check if Services are Running

```bash
docker compose ps
```

Make sure `auth-service` and `auth-db` are both "Up".

### Step 2: Seed the Database

```bash
# Option A: Use the seed script
docker compose exec auth-service npm run seed

# Option B: Use the create user script
docker compose exec auth-service node scripts/create-test-user.js

# Option C: Manual seed (if scripts don't work)
docker compose exec auth-db psql -U postgres -d auth_db -c "
INSERT INTO users (name, email, password_hash, role, tenant_id) 
VALUES 
  ('Admin User', 'admin@university.edu', '\$2b\$10\$rQ8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'admin', 'tenant-1'),
  ('John Doe', 'student@university.edu', '\$2b\$10\$rQ8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'student', 'tenant-1'),
  ('Dr. Jane Smith', 'professor@university.edu', '\$2b\$10\$rQ8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', 'professor', 'tenant-1')
ON CONFLICT (email) DO NOTHING;
"
```

**Note**: The password hash above is a placeholder. The seed script generates the correct hash.

### Step 3: Verify Users Exist

```bash
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT email, role FROM users;"
```

You should see:
```
        email              |   role    
---------------------------+-----------
 admin@university.edu      | admin
 student@university.edu    | student
 professor@university.edu  | professor
 seller@university.edu     | seller
```

### Step 4: Test Login via API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "password123"
  }'
```

If this works, the frontend should work too.

---

## 🆕 Alternative: Register a New User

If seeding doesn't work, register directly:

### Via API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@university.edu",
    "password": "password123",
    "role": "student",
    "tenantId": "tenant-1"
  }'
```

Then login with:
- Email: `test@university.edu`
- Password: `password123`

### Via Frontend:

1. Go to http://localhost:3000/login
2. You'll need to add a registration link, or use the API directly

---

## 🔍 Debugging Steps

### Check Service Logs

```bash
# Check auth service logs
docker compose logs auth-service

# Check for errors
docker compose logs auth-service | grep -i error

# Follow logs in real-time
docker compose logs -f auth-service
```

### Check Database Connection

```bash
# Test database connection
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT 1;"

# Check if tables exist
docker compose exec auth-db psql -U postgres -d auth_db -c "\dt"

# Check user count
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT COUNT(*) FROM users;"
```

### Check API Gateway

```bash
# Test if gateway is routing correctly
curl http://localhost:3001/health

# Check gateway logs
docker compose logs api-gateway
```

### Verify Password Hashing

The seed script uses bcrypt. If you manually created users, make sure passwords are hashed correctly:

```bash
# Check a user's password hash
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT email, LEFT(password_hash, 20) as hash_preview FROM users LIMIT 1;"
```

Password hashes should start with `$2b$10$` (bcrypt format).

---

## 🚨 Common Issues & Solutions

### Issue 1: "Database connection refused"

**Solution**:
```bash
# Restart database
docker compose restart auth-db

# Wait a few seconds, then restart service
docker compose restart auth-service
```

### Issue 2: "Table users does not exist"

**Solution**:
```bash
# Service should auto-create tables, but if not:
docker compose restart auth-service

# Check logs to see if tables were created
docker compose logs auth-service | grep -i "database initialized"
```

### Issue 3: "User exists but password wrong"

**Solution**:
```bash
# Delete and re-seed
docker compose exec auth-db psql -U postgres -d auth_db -c "DELETE FROM users;"
docker compose exec auth-service npm run seed
```

### Issue 4: "Service not responding"

**Solution**:
```bash
# Check if service is healthy
docker compose ps auth-service

# Restart service
docker compose restart auth-service

# Check service logs
docker compose logs auth-service
```

---

## ✅ Complete Reset (Nuclear Option)

If nothing works, reset everything:

```bash
# Stop and remove everything
docker compose down -v

# Remove any leftover containers
docker system prune -f

# Start fresh
docker compose up -d

# Wait for services to be ready (30-60 seconds)
sleep 30

# Seed all databases
chmod +x scripts/seed-all.sh
./scripts/seed-all.sh

# Or seed just auth service
docker compose exec auth-service npm run seed
```

---

## 📝 Test Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `password123` |
| Student | `student@university.edu` | `password123` |
| Professor | `professor@university.edu` | `password123` |
| Seller | `seller@university.edu` | `password123` |

---

## 🆘 Still Not Working?

1. **Check browser console** for frontend errors
2. **Check network tab** to see the actual API request/response
3. **Verify API Gateway is running**: http://localhost:3001/health
4. **Test direct API call** (see Step 4 above)
5. **Check CORS** - make sure frontend URL matches `FRONTEND_URL` in gateway

If you're still stuck, share:
- Output of `docker compose ps`
- Output of `docker compose logs auth-service | tail -20`
- Response from the curl login test




