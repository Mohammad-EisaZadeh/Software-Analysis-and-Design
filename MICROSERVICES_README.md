# Smart University Management Platform - Microservices Architecture

A comprehensive microservices-based backend system for the University Management Platform, featuring API Gateway, JWT authentication, RabbitMQ message broker, Saga pattern, Circuit Breaker, and multi-tenancy support.

## Architecture Overview

```
┌─────────────┐
│   Client    │
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         API Gateway (3001)          │
│  - JWT Validation                    │
│  - RBAC                              │
│  - Request Routing                   │
└──────┬───────────────────────────────┘
       │
       ├──► Auth Service (3002) ──────► PostgreSQL
       ├──► Resource Service (3003) ──► PostgreSQL
       ├──► Marketplace Service (3004) ► PostgreSQL + Redis + RabbitMQ
       ├──► E-Learning Service (3005) ─► PostgreSQL (Circuit Breaker)
       ├──► Notification Service (3006)► PostgreSQL + RabbitMQ
       ├──► IoT Service (3007) ────────► PostgreSQL
       └──► Shuttle Service (3008) ───► PostgreSQL
```

## Features

- ✅ **API Gateway**: Single entry point with JWT validation and RBAC
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-Based Access Control**: Student, Professor, Seller, Admin roles
- ✅ **Multi-Tenancy**: Tenant isolation across all services
- ✅ **Saga Pattern**: Distributed transaction management for checkout
- ✅ **Circuit Breaker**: Resilient inter-service communication
- ✅ **Message Broker**: RabbitMQ for async event processing
- ✅ **Caching**: Redis for hot endpoints (products list)
- ✅ **Database per Service**: Independent PostgreSQL databases
- ✅ **Docker Compose**: Complete infrastructure as code

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- 8GB+ RAM recommended

## Quick Start

1. **Clone the repository** (if not already done)

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Seed initial data:**
   ```bash
   chmod +x scripts/seed-all.sh
   ./scripts/seed-all.sh
   ```

   Or manually:
   ```bash
   docker-compose exec auth-service npm run seed
   docker-compose exec resource-service npm run seed
   docker-compose exec marketplace-service npm run seed
   docker-compose exec elearning-service npm run seed
   docker-compose exec iot-service npm run seed
   docker-compose exec shuttle-service npm run seed
   ```

4. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

5. **Test the API:**
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

## Services

### 1. API Gateway (Port 3001)
- Routes all client requests
- Validates JWT tokens
- Enforces RBAC
- Adds user context headers to downstream services

### 2. Auth Service (Port 3002)
- User registration and authentication
- JWT token generation
- User profile management
- Database: `auth_db`

**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### 3. Resource & Booking Service (Port 3003)
- Resource management (rooms, labs, etc.)
- Booking system with concurrency control
- Prevents overbooking using database constraints
- Database: `resource_db`

**Endpoints:**
- `GET /api/resources`
- `POST /api/resources` (Admin)
- `POST /api/bookings`
- `GET /api/bookings/my`

### 4. Marketplace Service (Port 3004)
- Product catalog
- Shopping cart
- Order processing with **Saga Pattern**
- Redis caching for products
- RabbitMQ event publishing
- Database: `marketplace_db`

**Endpoints:**
- `GET /api/marketplace/products`
- `POST /api/marketplace/products` (Seller)
- `POST /api/marketplace/cart/items`
- `POST /api/marketplace/checkout`

**Saga Flow:**
1. Reserve stock
2. Create order
3. Confirm order
4. Compensate on failure

### 5. E-Learning & Exam Service (Port 3005)
- Exam creation and management
- Exam submission and grading
- **Circuit Breaker** for notification calls
- Database: `elearning_db`

**Endpoints:**
- `POST /api/elearning/exams` (Professor)
- `GET /api/elearning/exams`
- `POST /api/elearning/exams/:id/start`
- `POST /api/elearning/exams/:id/submit`
- `GET /api/elearning/circuit-breaker/status`

### 6. Notification Service (Port 3006)
- Notification creation
- RabbitMQ event consumption
- Database: `notification_db`

**Endpoints:**
- `POST /api/notifications/notify` (Internal)
- `GET /api/notifications/notifications`

### 7. IoT Service (Port 3007)
- Sensor data collection
- Real-time sensor readings
- Simulated data generation (cron job)
- Database: `iot_db`

**Endpoints:**
- `GET /api/iot/sensors/:id/latest`
- `GET /api/iot/sensors/:id/history`

### 8. Shuttle Service (Port 3008)
- Shuttle location tracking
- Real-time location updates
- Simulated GPS data (cron job)
- Database: `shuttle_db`

**Endpoints:**
- `GET /api/shuttle/shuttle/:id/location`
- `GET /api/shuttle/shuttles`

## Infrastructure

### Databases
Each service has its own PostgreSQL database:
- `auth-db`: User authentication
- `resource-db`: Resources and bookings
- `marketplace-db`: Products, orders, carts
- `elearning-db`: Exams and submissions
- `notification-db`: Notifications
- `iot-db`: Sensor readings
- `shuttle-db`: Shuttle locations

### Message Broker
- **RabbitMQ**: Port 5672 (AMQP), Port 15672 (Management UI)
  - Default credentials: `admin/admin`
  - Management UI: http://localhost:15672

### Cache
- **Redis**: Port 6379
  - Used for caching product lists
  - TTL: 5 minutes

## Environment Variables

Key environment variables (configured in `docker-compose.yml`):

- `JWT_SECRET`: Secret key for JWT signing
- `FRONTEND_URL`: CORS origin for API Gateway
- `RABBITMQ_URL`: RabbitMQ connection string
- `REDIS_URL`: Redis connection string

## Testing the Architecture

### Test Saga Pattern
1. Add items to cart
2. Checkout (triggers saga)
3. Check RabbitMQ for order events
4. Verify order in database

### Test Circuit Breaker
1. Start an exam (calls notification service)
2. Stop notification service: `docker-compose stop notification-service`
3. Start more exams (circuit should open after 3 failures)
4. Check circuit breaker status: `GET /api/elearning/circuit-breaker/status`
5. Restart notification service: `docker-compose start notification-service`
6. Wait 30 seconds (circuit enters HALF_OPEN)
7. Start another exam (circuit should close if successful)

### Test Multi-Tenancy
1. Create users with different `tenantId`
2. Verify data isolation between tenants

## Development

### Running Services Locally

1. **Start infrastructure only:**
   ```bash
   docker-compose up -d auth-db resource-db marketplace-db elearning-db notification-db iot-db shuttle-db rabbitmq redis
   ```

2. **Run services locally:**
   ```bash
   cd services/auth-service
   npm install
   npm run dev
   ```

### Adding a New Service

1. Create service directory: `services/new-service/`
2. Add `package.json`, `Dockerfile`, and source code
3. Add database service to `docker-compose.yml`
4. Add service to `docker-compose.yml`
5. Update API Gateway routing
6. Add seed script if needed

## Monitoring

### Health Checks
All services expose `/health` endpoint:
```bash
curl http://localhost:3001/health
```

### RabbitMQ Management
Access RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin`

### Database Access
Connect to any database:
```bash
docker-compose exec auth-db psql -U postgres -d auth_db
```

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>
```

### Database connection issues
```bash
# Check database health
docker-compose ps

# Wait for databases to be ready
docker-compose up -d
sleep 10
```

### Port conflicts
Modify ports in `docker-compose.yml` if needed.

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API reference.

## Security Notes

⚠️ **Production Deployment:**
- Change `JWT_SECRET` to a strong random value
- Use environment-specific secrets management
- Enable HTTPS/TLS
- Configure proper CORS origins
- Add rate limiting
- Implement request validation
- Use database connection pooling
- Enable database SSL connections

## License

This project is part of the University Management System.





