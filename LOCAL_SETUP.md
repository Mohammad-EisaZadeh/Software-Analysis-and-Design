# Local Development Setup (Simple Database)

This guide provides a simpler setup for local development using SQLite instead of PostgreSQL.

## Option 1: SQLite with Docker (Recommended)

Use the simplified docker-compose file that uses SQLite:

```bash
# Start services with SQLite
docker compose -f docker-compose.local.yml up --build
```

This setup:
- ✅ Uses SQLite databases (no PostgreSQL containers)
- ✅ Still uses RabbitMQ and Redis
- ✅ Databases stored in `services/*/data/` directories
- ✅ Much lighter on resources

## Option 2: Pure Local Development (No Docker)

Run services directly on your machine with SQLite:

### Prerequisites

```bash
# Install Node.js dependencies
cd services/auth-service
npm install sqlite3

# Repeat for each service
```

### Update Service Code

Each service needs to support SQLite. Example for auth-service:

1. Install sqlite3:
```bash
npm install sqlite3
```

2. Use the SQLite version of the service:
```bash
# Copy the SQLite version
cp src/index-sqlite.js src/index.js
```

3. Run the service:
```bash
npm start
```

### Database Location

SQLite databases will be created in:
- `services/auth-service/data/auth.db`
- `services/resource-service/data/resource.db`
- etc.

## Option 3: Hybrid (Services Local, Infrastructure Docker)

Run only RabbitMQ and Redis in Docker, services locally:

```bash
# Start only infrastructure
docker compose up rabbitmq redis

# Run services locally (each in separate terminal)
cd services/auth-service && npm start
cd services/resource-service && npm start
# ... etc
```

## Quick Start (Simplest)

1. **Start with SQLite Docker setup:**
   ```bash
   docker compose -f docker-compose.local.yml up
   ```

2. **Seed data (if needed):**
   ```bash
   # Services will auto-create databases on first run
   # Or manually seed:
   docker compose -f docker-compose.local.yml exec auth-service npm run seed
   ```

3. **Access services:**
   - API Gateway: http://localhost:3001
   - RabbitMQ Management: http://localhost:15672 (admin/admin)
   - Redis: localhost:6379

## Database Files

SQLite databases are stored in:
```
services/
  auth-service/data/auth.db
  resource-service/data/resource.db
  marketplace-service/data/marketplace.db
  elearning-service/data/elearning.db
  notification-service/data/notification.db
  iot-service/data/iot.db
  shuttle-service/data/shuttle.db
```

## Advantages of SQLite for Local Dev

- ✅ No database server needed
- ✅ Faster startup
- ✅ Easier to reset (just delete .db files)
- ✅ Portable (databases are files)
- ✅ No connection strings to manage

## Disadvantages

- ❌ Not suitable for production
- ❌ Limited concurrent writes
- ❌ No advanced PostgreSQL features

## Migration to PostgreSQL

When ready for production, switch back to the main `docker-compose.yml` which uses PostgreSQL.

## Troubleshooting

### Database locked errors
- SQLite doesn't handle high concurrency well
- Use PostgreSQL for production or high-load testing

### Permission errors
- Ensure data directories are writable:
  ```bash
  chmod -R 755 services/*/data
  ```

### Reset databases
- Simply delete the .db files:
  ```bash
  rm services/*/data/*.db
  ```




