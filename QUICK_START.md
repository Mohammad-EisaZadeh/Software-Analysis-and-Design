# Quick Start Guide

## Simplest Setup (SQLite - No PostgreSQL)

For local development, use the simplified setup with SQLite:

```bash
# Start all services with SQLite databases
docker compose -f docker-compose.local.yml up --build
```

This will:
- ✅ Start all microservices
- ✅ Use SQLite (no PostgreSQL containers needed)
- ✅ Start RabbitMQ and Redis
- ✅ Start API Gateway

**Access:**
- API Gateway: http://localhost:3001
- RabbitMQ UI: http://localhost:15672 (admin/admin)

## Full Setup (PostgreSQL)

For production-like setup with PostgreSQL:

```bash
# Start all services with PostgreSQL
docker compose up --build

# Seed databases
./scripts/seed-all.sh
```

## Test the API

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

## Frontend

```bash
# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```

Access frontend at: http://localhost:3000

## Database Files (SQLite)

SQLite databases are stored in:
- `services/auth-service/data/auth.db`
- `services/resource-service/data/resource.db`
- etc.

To reset: Delete the `.db` files and restart services.

## Troubleshooting

**Port conflicts?**
- Change ports in `docker-compose.yml` or `docker-compose.local.yml`

**Services not starting?**
```bash
docker compose logs <service-name>
```

**Reset everything:**
```bash
docker compose down -v  # Removes volumes
docker compose up --build
```

For more details, see:
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Local development guide
- [MICROSERVICES_README.md](./MICROSERVICES_README.md) - Full architecture docs




