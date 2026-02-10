# How to Run the Project

Complete step-by-step guide to run the University Management System.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 18+** and **npm** (for frontend)
- **Git** (if cloning)

## Option 1: Full Setup (Recommended for First Time)

### Step 1: Start Backend Services

```bash
# Start all microservices, databases, RabbitMQ, and Redis
docker compose up --build
```

This will start:
- 7 PostgreSQL databases
- 7 microservices
- API Gateway
- RabbitMQ
- Redis

**Wait for all services to be healthy** (about 1-2 minutes)

### Step 2: Seed Initial Data

Open a new terminal and run:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/seed-all.sh

# Run seed script
./scripts/seed-all.sh
```

Or manually seed each service:

```bash
docker compose exec auth-service npm run seed
docker compose exec resource-service npm run seed
docker compose exec marketplace-service npm run seed
docker compose exec elearning-service npm run seed
docker compose exec iot-service npm run seed
docker compose exec shuttle-service npm run seed
```

### Step 3: Start Frontend

Open a new terminal:

```bash
# Install dependencies (first time only)
npm install

# Start Next.js development server
npm run dev
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

### Step 5: Login

Use these demo credentials:
- **Student**: `student@university.edu` / `password123`
- **Professor**: `professor@university.edu` / `password123`
- **Admin**: `admin@university.edu` / `password123`

---

## Option 2: Simplified Setup (SQLite - Faster)

### Step 1: Start Services with SQLite

```bash
docker compose -f docker-compose.local.yml up --build
```

This uses SQLite instead of PostgreSQL (lighter, faster startup).

### Step 2: Start Frontend

```bash
npm install
npm run dev
```

### Step 3: Access

- Frontend: http://localhost:3000
- API Gateway: http://localhost:3001

---

## Option 3: Backend Only (API Testing)

### Start Backend

```bash
docker compose up --build
```

### Test API

```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@university.edu",
    "password": "password123",
    "role": "student",
    "tenantId": "tenant-1"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "password123"
  }'
```

---

## Option 4: Frontend Only (Development)

If you just want to work on the frontend:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will run on http://localhost:3000 but API calls will fail unless backend is running.

---

## Common Commands

### Check Service Status

```bash
# See all running services
docker compose ps

# Check logs
docker compose logs <service-name>

# Follow logs
docker compose logs -f <service-name>
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (deletes databases)
docker compose down -v
```

### Restart a Service

```bash
docker compose restart <service-name>
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker compose up --build <service-name>
```

---

## Troubleshooting

### Login "Invalid Credentials" Error

**Most common issue**: Database hasn't been seeded.

**Quick fix**:
```bash
# Seed the auth database
docker compose exec auth-service npm run seed

# Verify users exist
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT email, role FROM users;"
```

**Test login**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@university.edu", "password": "password123"}'
```

📖 **See [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) for detailed login troubleshooting**

### Port Already in Use

If you get port conflicts:

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# Change ports in docker-compose.yml if needed
```

### Services Not Starting

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs auth-service

# Restart
docker compose restart
```

### Database Connection Errors

```bash
# Wait for databases to be ready
docker compose ps

# Check database health
docker compose exec auth-db pg_isready -U postgres
```

### Frontend Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Reset Everything

```bash
# Stop and remove everything
docker compose down -v

# Remove all containers and images
docker system prune -a

# Start fresh
docker compose up --build
```

---

## Development Workflow

### 1. Start Infrastructure

```bash
# Start only databases, RabbitMQ, Redis
docker compose up auth-db resource-db marketplace-db elearning-db notification-db iot-db shuttle-db rabbitmq redis
```

### 2. Run Services Locally

In separate terminals:

```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm install
npm run dev

# Terminal 2 - Resource Service
cd services/resource-service
npm install
npm run dev

# ... repeat for other services
```

### 3. Run Frontend

```bash
npm run dev
```

---

## Production Build

### Backend

```bash
# Build production images
docker compose build

# Start in production mode
docker compose up -d
```

### Frontend

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## Quick Reference

| Component | URL | Credentials |
|-----------|-----|-------------|
| Frontend | http://localhost:3000 | See login page |
| API Gateway | http://localhost:3001 | JWT token required |
| RabbitMQ UI | http://localhost:15672 | admin/admin |
| Auth Service | http://localhost:3002 | Direct access |
| Resource Service | http://localhost:3003 | Direct access |
| Marketplace Service | http://localhost:3004 | Direct access |
| E-Learning Service | http://localhost:3005 | Direct access |
| Notification Service | http://localhost:3006 | Direct access |
| IoT Service | http://localhost:3007 | Direct access |
| Shuttle Service | http://localhost:3008 | Direct access |

---

## Next Steps

After running the project:

1. **Explore the Frontend**: Navigate through different role dashboards
2. **Test API**: Use Postman or curl to test endpoints
3. **Check RabbitMQ**: View message queues at http://localhost:15672
4. **Review Logs**: Monitor service logs for debugging

For more details:
- [QUICK_START.md](./QUICK_START.md) - Quick setup
- [MICROSERVICES_README.md](./MICROSERVICES_README.md) - Architecture details
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

