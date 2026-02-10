# University Management System

A modern, scalable University Management System with microservices backend and Next.js frontend.

## 🚀 Quick Start

### Option 1: Full Setup (PostgreSQL - Recommended)

```bash
# 1. Start all backend services
docker compose up --build

# 2. Wait for services to start, then seed data (in new terminal)
chmod +x scripts/seed-all.sh
./scripts/seed-all.sh

# 3. Start frontend (in new terminal)
npm install
npm run dev
```

### Option 2: Simplified Setup (SQLite - Faster)

```bash
# 1. Start services with SQLite
docker compose -f docker-compose.local.yml up --build

# 2. Start frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Login: `student@university.edu` / `password123`

📖 **See [HOW_TO_RUN.md](./HOW_TO_RUN.md) for complete step-by-step instructions**

## Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Microservices with API Gateway, JWT Auth, RabbitMQ, Redis
- **Databases**: PostgreSQL (production) or SQLite (local dev)

## Features

- **Role-Based Access Control**: Student, Professor, Seller, Admin dashboards
- **Microservices**: 7 independent services with own databases
- **Saga Pattern**: Distributed transactions for marketplace checkout
- **Circuit Breaker**: Resilient inter-service communication
- **Multi-Tenancy**: Tenant isolation across all services

## Documentation

- **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** ⭐ - Complete step-by-step run guide
- [QUICK_START.md](./QUICK_START.md) - Quick setup reference
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Local development with SQLite
- [MICROSERVICES_README.md](./MICROSERVICES_README.md) - Backend architecture
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Frontend integration

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React

**Backend:**
- Node.js/Express
- PostgreSQL / SQLite
- RabbitMQ
- Redis
- Docker Compose




