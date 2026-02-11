# University Management System

A modern, scalable University Management System with microservices backend and Next.js frontend.

## ðŸš€ Quick Start

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

ðŸ“– **See [HOW_TO_RUN.md](./HOW_TO_RUN.md) for complete step-by-step instructions**

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

- **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** â­ - Complete step-by-step run guide
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

---

## Merged Documentation


### Source: API_DOCUMENTATION.md

# API Documentation

## Base URL
All API requests should be made to the API Gateway:
```
http://localhost:3001/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <accessToken>
```

The JWT token contains:
- `userId`: User ID
- `role`: User role (student, professor, seller, admin)
- `tenantId`: Tenant ID for multi-tenancy

---

## 1. Authentication Service

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "password123",
  "role": "student",
  "tenantId": "tenant-1"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@university.edu",
    "role": "student",
    "tenantId": "tenant-1"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@university.edu",
    "role": "student",
    "tenantId": "tenant-1"
  }
}
```

### GET /api/users/me
Get current user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@university.edu",
  "role": "student",
  "tenantId": "tenant-1",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 2. Resource & Booking Service

### GET /api/resources
Get all resources (filtered by tenant).

**Query Parameters:**
- `type` (optional): Filter by resource type

**Response:**
```json
[
  {
    "id": 1,
    "name": "Conference Room A",
    "type": "room",
    "capacity": 20,
    "tenant_id": "tenant-1"
  }
]
```

### POST /api/resources
Create a new resource (Admin only).

**Request Body:**
```json
{
  "name": "Lab 101",
  "type": "lab",
  "capacity": 30
}
```

### POST /api/bookings
Create a booking.

**Request Body:**
```json
{
  "resourceId": 1,
  "startTime": "2024-12-01T10:00:00Z",
  "endTime": "2024-12-01T12:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "resource_id": 1,
  "user_id": 1,
  "start_time": "2024-12-01T10:00:00Z",
  "end_time": "2024-12-01T12:00:00Z",
  "status": "confirmed",
  "tenant_id": "tenant-1"
}
```

### GET /api/bookings/my
Get user's bookings.

**Response:**
```json
[
  {
    "id": 1,
    "resource_id": 1,
    "user_id": 1,
    "start_time": "2024-12-01T10:00:00Z",
    "end_time": "2024-12-01T12:00:00Z",
    "status": "confirmed",
    "resource_name": "Conference Room A",
    "resource_type": "room"
  }
]
```

---

## 3. Marketplace Service

### GET /api/marketplace/products
Get all products (cached in Redis).

**Response:**
```json
[
  {
    "id": 1,
    "seller_id": 1,
    "name": "Notebook",
    "price": "5.99",
    "stock": 100,
    "tenant_id": "tenant-1"
  }
]
```

### POST /api/marketplace/products
Create a product (Seller only).

**Request Body:**
```json
{
  "name": "Textbook",
  "price": 49.99,
  "stock": 30
}
```

### POST /api/marketplace/cart/items
Add item to cart.

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

### POST /api/marketplace/checkout
Checkout cart (Saga Pattern).

**Response:**
```json
{
  "message": "Order placed successfully",
  "orderId": 1,
  "sagaId": "uuid-here"
}
```

**Saga Flow:**
1. Reserve stock
2. Create order
3. Confirm order
4. Publish event to RabbitMQ

If any step fails, compensating actions are executed.

---

## 4. E-Learning & Exam Service

### POST /api/elearning/exams
Create an exam (Professor only).

**Request Body:**
```json
{
  "title": "Midterm Exam",
  "startTime": "2024-12-15T10:00:00Z",
  "duration": 90,
  "questions": [
    {
      "text": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctOption": 1
    }
  ]
}
```

### GET /api/elearning/exams
Get all exams.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Midterm Exam",
    "created_by": 3,
    "start_time": "2024-12-15T10:00:00Z",
    "duration": 90,
    "questions_count": 5
  }
]
```

### POST /api/elearning/exams/:id/start
Start an exam (triggers notification via Circuit Breaker).

**Response:**
```json
{
  "exam": {
    "id": 1,
    "title": "Midterm Exam",
    "start_time": "2024-12-15T10:00:00Z",
    "duration": 90
  },
  "submission": {
    "id": 1,
    "exam_id": 1,
    "user_id": 1,
    "started_at": "2024-12-15T10:00:00Z"
  },
  "questions": [
    {
      "id": 1,
      "text": "What is 2+2?",
      "options": ["3", "4", "5", "6"]
    }
  ]
}
```

### POST /api/elearning/exams/:id/submit
Submit exam answers.

**Request Body:**
```json
{
  "answers": {
    "1": 1,
    "2": 0,
    "3": 2
  }
}
```

**Response:**
```json
{
  "submission": {
    "id": 1,
    "exam_id": 1,
    "user_id": 1,
    "score": "85.50",
    "submitted_at": "2024-12-15T11:30:00Z"
  },
  "score": "85.50",
  "correctAnswers": 3,
  "totalQuestions": 5
}
```

### GET /api/elearning/circuit-breaker/status
Get circuit breaker status.

**Response:**
```json
{
  "state": "CLOSED",
  "failureCount": 0,
  "lastFailureTime": null
}
```

---

## 5. Notification Service

### POST /api/notifications/notify
Create a notification (internal use, called by other services).

### GET /api/notifications/notifications
Get user's notifications.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "message": "Your order has been confirmed",
    "read": false,
    "created_at": "2024-12-01T10:00:00Z"
  }
]
```

---

## 6. IoT Service

### GET /api/iot/sensors/:id/latest
Get latest sensor reading.

**Response:**
```json
{
  "id": 1,
  "sensor_id": "temp-001",
  "value": "25.50",
  "timestamp": "2024-12-01T10:00:00Z",
  "tenant_id": "tenant-1"
}
```

### GET /api/iot/sensors/:id/history
Get sensor history.

**Query Parameters:**
- `limit` (optional): Number of records (default: 100)

---

## 7. Shuttle Service

### GET /api/shuttle/shuttle/:id/location
Get shuttle location.

**Response:**
```json
{
  "id": 1,
  "shuttle_id": "shuttle-001",
  "lat": "40.71280000",
  "lng": "-74.00600000",
  "timestamp": "2024-12-01T10:00:00Z",
  "tenant_id": "tenant-1"
}
```

### GET /api/shuttle/shuttles
Get all shuttles' latest locations.

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Multi-Tenancy

All services enforce tenant isolation. The `tenantId` is extracted from the JWT token and used to filter all database queries. Users can only access data belonging to their tenant.

---

## Circuit Breaker

The E-Learning service uses a Circuit Breaker when calling the Notification service. If the Notification service fails 3 times, the circuit opens and subsequent calls fail fast. After 30 seconds, the circuit enters HALF_OPEN state to test recovery.

---

## Saga Pattern

The Marketplace checkout process uses a Saga pattern:
1. **Reserve Stock**: Decrement product stock
2. **Create Order**: Create order record
3. **Confirm Order**: Mark order as confirmed, clear cart
4. **Compensation**: If any step fails, restore stock and cancel order

All steps are logged in `saga_logs` table for audit and recovery.

---

## CORS

The API Gateway is configured to accept requests from:
- `http://localhost:3000` (default)
- Configure via `FRONTEND_URL` environment variable


### Source: BUG_FIXES.md

# Bug Fixes Applied

## Summary
Fixed multiple runtime bugs related to array handling, null/undefined checks, and date parsing throughout the frontend application.

## Fixed Issues

### 1. Array Type Checking
**Problem**: Code was accessing array methods on potentially non-array data from API responses.

**Fixed Files**:
- `app/student/page.tsx` - Added `Array.isArray()` checks before filtering
- `app/student/exams/page.tsx` - Added array check before setting state
- `app/student/notifications/page.tsx` - Added array check
- `app/student/marketplace/page.tsx` - Added array check
- `app/professor/page.tsx` - Added array check
- `app/professor/courses/page.tsx` - Added array check
- `app/professor/exams/page.tsx` - Added array check
- `app/professor/materials/page.tsx` - Added array check
- `app/professor/students/page.tsx` - Added array checks for both students and exams
- `app/student/transcript/page.tsx` - Added array check
- `app/admin/page.tsx` - Added array check

**Solution**: Changed from `if (response.data)` to `if (Array.isArray(response.data))` to ensure type safety.

### 2. Null/Undefined Date Handling
**Problem**: Date parsing could fail if `start_time`, `created_at`, or other date fields were null/undefined.

**Fixed Files**:
- `app/student/exams/page.tsx` - Added null check before date parsing
- `app/student/notifications/page.tsx` - Added null check for `created_at`
- `app/professor/exams/page.tsx` - Added null check for `created_at`
- `lib/utils.ts` - Enhanced `formatDate()` and `formatDateTime()` to handle null/undefined and invalid dates

**Solution**: 
- Added null checks before creating Date objects
- Enhanced utility functions to safely handle null/undefined/invalid dates
- Return 'N/A' or 'Invalid Date' for problematic dates

### 3. Product Stock Handling
**Problem**: Product stock could be undefined, causing errors in comparisons.

**Fixed Files**:
- `app/student/marketplace/page.tsx` - Added null check for stock

**Solution**: Changed `product.stock` to `product.stock || 0` and added proper null checks.

### 4. Array Method Safety
**Problem**: Calling `.map()`, `.filter()` on potentially undefined arrays.

**Fixed Files**:
- `app/professor/students/page.tsx` - Added array checks before filtering/mapping
- `app/professor/materials/page.tsx` - Added array check before mapping

**Solution**: Wrapped array operations with `Array.isArray()` checks or used ternary operators.

### 5. Missing Key Props
**Problem**: React keys could be undefined in some map operations.

**Fixed Files**:
- `app/professor/page.tsx` - Added fallback key generation

**Solution**: Added `exam.id || Math.random()` for key generation.

## Testing Recommendations

1. **Test with empty API responses**: Ensure pages handle empty arrays gracefully
2. **Test with null/undefined data**: Verify date fields and optional properties don't crash
3. **Test with malformed dates**: Check that invalid date strings are handled
4. **Test with missing properties**: Ensure optional fields don't cause errors

## Remaining Potential Issues

1. **API Error Handling**: Some pages may need more robust error handling for network failures
2. **Loading States**: Some pages might benefit from better loading indicators
3. **Empty States**: Some pages could have better empty state messages

## Notes

- All changes maintain backward compatibility
- Error handling is now more defensive
- Date utilities are more robust
- Array operations are type-safe


### Source: COURSE_SERVICE_IMPLEMENTATION.md

# Course Service Implementation

## Overview
A complete course management service has been implemented with full CRUD operations, enrollment functionality, and multi-tenancy support.

## Service Details

### Database Schema
- **courses table**: Stores course information (code, name, professor_id, credits, semester, tenant_id)
- **enrollments table**: Tracks student enrollments (course_id, student_id, tenant_id)

### Endpoints Implemented

#### Course Management (Admin)
- `GET /courses` - List all courses (with optional filters for professorId/studentId)
- `GET /courses/my` - Get courses for current user (student/professor)
- `GET /courses/:id` - Get course details
- `POST /courses` - Create course (admin only)
- `PUT /courses/:id` - Update course (admin only)
- `DELETE /courses/:id` - Delete course (admin only)

#### Enrollment
- `POST /courses/:id/enroll` - Enroll student in course

### Service Configuration
- **Port**: 3009
- **Database**: course_db (PostgreSQL)
- **Multi-tenancy**: All operations are tenant-scoped

## Frontend Integration

### Admin Courses Page
- âœ… List all courses
- âœ… Create new courses
- âœ… Edit courses
- âœ… Delete courses
- âœ… Assign professors to courses
- âœ… Auto-refresh after operations

### Student Courses Page
- âœ… View enrolled courses
- âœ… View available courses
- âœ… Enroll in courses
- âœ… Search functionality

### Professor Courses Page
- âœ… View assigned courses
- âœ… See enrolled student count

## API Client

Added `coursesApi` to `lib/api.ts` with methods:
- `getCourses(professorId?, studentId?)`
- `getMyCourses()`
- `getCourse(id)`
- `createCourse(data)`
- `updateCourse(id, data)`
- `deleteCourse(id)`
- `enrollInCourse(courseId)`

## Docker Configuration

### Added to docker-compose.yml:
- `course-db`: PostgreSQL database for courses
- `course-service`: Course management service (port 3009)
- Added to API Gateway dependencies

### Gateway Routes
- `/api/courses/*` â†’ `course-service:3009/courses/*`

## Files Created

1. `services/course-service/package.json`
2. `services/course-service/src/index.js` - Main service file
3. `services/course-service/src/seed.js` - Database seeding script
4. `services/course-service/Dockerfile`

## Files Updated

1. `docker-compose.yml` - Added course-db and course-service
2. `gateway/src/index.js` - Added course service routing
3. `lib/api.ts` - Added coursesApi
4. `app/admin/courses/page.tsx` - Full CRUD integration
5. `app/student/courses/page.tsx` - Enrollment integration
6. `app/professor/courses/page.tsx` - Course viewing integration

## Usage

### Starting the Service
```bash
docker-compose up -d course-db course-service
```

### Seeding Data
```bash
docker-compose exec course-service npm run seed
```

### Testing Endpoints
All endpoints are accessible via the API Gateway at:
- `http://localhost:3001/api/courses/*`

## Notes

- Professor names are fetched separately from the auth service and merged in the frontend
- All operations respect tenant isolation
- Enrollment prevents duplicate enrollments
- Course codes must be unique per tenant


### Source: FRONTEND_BACKEND_INTEGRATION.md

# Frontend-Backend Integration Status

## âœ… Completed Integrations

### Authentication
- âœ… Login page connected to `/api/auth/login`
- âœ… Registration via `/api/auth/register`
- âœ… User profile via `/api/users/me`
- âœ… JWT token management

### Student Pages
- âœ… Dashboard - Connected to exams and notifications APIs
- âœ… Exams - Connected to `/api/elearning/exams`
- âœ… Notifications - Connected to `/api/notifications/notifications`
- âœ… Marketplace - Connected to `/api/marketplace/products` and cart
- âœ… Cart - Connected to checkout API
- âš ï¸ Courses - Backend endpoint needed
- âš ï¸ Transcript - Backend endpoint needed (submissions)
- âš ï¸ Materials - Backend endpoint needed

### Professor Pages
- âœ… Dashboard - Connected to exams API
- âœ… Exams - Connected to create/get exams
- âš ï¸ Courses - Backend endpoint needed
- âš ï¸ Students - Backend endpoint needed
- âš ï¸ Grades - Backend endpoint needed (submissions)
- âš ï¸ Objections - Backend endpoint needed
- âš ï¸ Materials - Backend endpoint needed

### Admin Pages
- âš ï¸ Students Management - Uses registration API (full CRUD needed)
- âš ï¸ Professors Management - Backend endpoint needed
- âš ï¸ Courses Management - Backend endpoint needed

### Other Services
- âœ… Resources - API endpoints available
- âœ… Marketplace - Full integration
- âœ… E-Learning - Exams integrated
- âœ… Notifications - Integrated
- âš ï¸ IoT - Endpoints available but not used in frontend
- âš ï¸ Shuttle - Endpoints available but not used in frontend

## ðŸ”§ Backend Endpoints Needed

### Courses Management
```
GET    /api/courses              - List all courses
POST   /api/courses              - Create course (admin)
GET    /api/courses/:id          - Get course details
PUT    /api/courses/:id          - Update course
DELETE /api/courses/:id          - Delete course
POST   /api/courses/:id/enroll   - Enroll student
```

### Students Management (Admin)
```
GET    /api/admin/users?role=student  - List students
PUT    /api/admin/users/:id           - Update user
DELETE /api/admin/users/:id           - Delete user
```

### Professors Management (Admin)
```
GET    /api/admin/users?role=professor - List professors
```

### Grades Management
```
GET    /api/elearning/exams/:id/submissions  - Get exam submissions
POST   /api/elearning/exams/:id/grade       - Grade submission
GET    /api/elearning/grades                 - Get all grades
```

### Course Materials
```
GET    /api/courses/:id/materials  - Get course materials
POST   /api/courses/:id/materials  - Upload material (professor)
DELETE /api/materials/:id          - Delete material
```

### Objections
```
GET    /api/objections              - List objections
POST   /api/objections              - Create objection (student)
PUT    /api/objections/:id/reply   - Reply to objection (professor)
```

## ðŸ“ Mock Data Removed

All mock data imports have been removed from:
- âœ… Student dashboard
- âœ… Student exams
- âœ… Student notifications
- âœ… Student marketplace
- âœ… Student cart
- âœ… Student courses (prepared for API)
- âœ… Student transcript (prepared for API)
- âœ… Student materials (prepared for API)
- âœ… Student profile
- âœ… Professor dashboard
- âœ… Professor courses
- âœ… Professor exams
- âœ… Professor grades (prepared for API)
- âœ… Professor students (prepared for API)
- âœ… Professor materials (prepared for API)
- âœ… Professor objections (prepared for API)
- âœ… Professor profile
- âœ… Admin dashboard
- âœ… Admin students
- âœ… Admin professors
- âœ… Admin courses (prepared for API)
- âœ… Admin profile

**Note:** `lib/mockData.ts` has been deleted. All pages now use real API calls or are prepared for API integration.

## ðŸš€ Next Steps

1. **Implement missing backend endpoints** (see list above)
2. **Complete admin CRUD operations** in backend
3. **Add course enrollment functionality**
4. **Implement materials upload/download**
5. **Add objections system**
6. **Connect IoT and Shuttle services to frontend** (optional)

## ðŸ“‹ Files Updated

### API Client (`lib/api.ts`)
- âœ… Expanded with all available endpoints
- âœ… Added resources, marketplace, elearning, notifications, IoT, shuttle APIs

### Student Pages
- âœ… `app/student/page.tsx` - Dashboard
- âœ… `app/student/exams/page.tsx` - Exams
- âœ… `app/student/notifications/page.tsx` - Notifications
- âœ… `app/student/marketplace/page.tsx` - Marketplace
- âœ… `app/student/cart/page.tsx` - Cart
- âœ… `app/student/courses/page.tsx` - Courses (prepared)
- âœ… `app/student/transcript/page.tsx` - Transcript (prepared)
- âœ… `app/student/materials/page.tsx` - Materials (prepared)

### Professor Pages
- âœ… `app/professor/page.tsx` - Dashboard
- âœ… `app/professor/grades/page.tsx` - Grades (prepared)
- âš ï¸ Other professor pages need similar updates

### Admin Pages
- âœ… `app/admin/students/page.tsx` - Students (uses registration API)
- âš ï¸ Other admin pages need similar updates

## ðŸ’¡ Usage Notes

- All pages now use real API calls where endpoints exist
- Pages show loading states while fetching data
- Error handling is in place
- Mock data has been removed
- Pages are prepared for additional backend endpoints

## ðŸ”— API Base URL

Configured in `lib/api.ts`:
- Default: `http://localhost:3001/api`
- Can be overridden with `NEXT_PUBLIC_API_URL` environment variable


### Source: HOW_TO_RUN.md

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

ðŸ“– **See [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) for detailed login troubleshooting**

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


### Source: INTEGRATION_GUIDE.md

# Frontend-Backend Integration Guide

This guide explains how to integrate the Next.js frontend with the microservices backend.

## Quick Start

1. **Start the backend services:**
   ```bash
   docker-compose up -d
   ```

2. **Seed the databases:**
   ```bash
   ./scripts/seed-all.sh
   ```

3. **Start the frontend:**
   ```bash
   npm install
   npm run dev
   ```

4. **Login with demo credentials:**
   - Email: `student@university.edu`
   - Password: `password123`

## API Configuration

The frontend is configured to use the API Gateway at:
- Development: `http://localhost:3001/api`
- Production: Set `NEXT_PUBLIC_API_URL` environment variable

## Authentication Flow

1. User submits login form
2. Frontend calls `POST /api/auth/login`
3. Backend returns JWT token
4. Token stored in `localStorage`
5. Token included in all subsequent requests via `Authorization` header

## API Client Usage

The frontend includes an API client (`lib/api.ts`) that handles:
- Token management
- Request/response formatting
- Error handling

Example usage:
```typescript
import { authApi } from '@/lib/api';

// Login
const response = await authApi.login(email, password);
if (response.data) {
  // Token automatically stored
  router.push('/student');
}

// Get current user
const userResponse = await authApi.getMe();
```

## Updating Frontend Pages

To connect frontend pages to the backend:

1. **Import the API client:**
   ```typescript
   import { apiClient } from '@/lib/api';
   ```

2. **Make API calls:**
   ```typescript
   const response = await apiClient.get('/marketplace/products');
   if (response.data) {
     setProducts(response.data);
   }
   ```

3. **Handle errors:**
   ```typescript
   if (response.error) {
     setError(response.error);
   }
   ```

## Example: Marketplace Page Integration

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await apiClient.get('/marketplace/products');
      if (response.data) {
        setProducts(response.data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const addToCart = async (productId: string, quantity: number) => {
    const response = await apiClient.post('/marketplace/cart/items', {
      productId,
      quantity,
    });
    if (response.error) {
      alert(response.error);
    } else {
      alert('Added to cart!');
    }
  };

  // ... render products
}
```

## CORS Configuration

The API Gateway is configured to accept requests from:
- `http://localhost:3000` (default Next.js dev server)

To change this, update `FRONTEND_URL` in `docker-compose.yml` or `.env`.

## Error Handling

The API client automatically handles:
- Network errors
- HTTP errors
- JSON parsing errors

All errors are returned in the format:
```typescript
{
  error: string;
}
```

## Token Refresh

Currently, tokens don't expire (24h default). To implement refresh:
1. Add refresh token endpoint
2. Intercept 401 responses
3. Refresh token automatically
4. Retry original request

## Testing

### Test Authentication
```bash
# Register
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

### Test Protected Endpoint
```bash
# Get products (requires token)
curl -X GET http://localhost:3001/api/marketplace/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

1. **Update all frontend pages** to use the API client
2. **Add loading states** for async operations
3. **Implement error boundaries** for better UX
4. **Add form validation** on frontend
5. **Implement optimistic updates** where appropriate
6. **Add request caching** for frequently accessed data

## Common Issues

### CORS Errors
- Ensure `FRONTEND_URL` in API Gateway matches your frontend URL
- Check browser console for specific CORS error

### 401 Unauthorized
- Token may be expired or invalid
- Check token in `localStorage`
- Re-login if needed

### 403 Forbidden
- User role doesn't have permission
- Check user role in JWT token

### Connection Refused
- Ensure backend services are running: `docker-compose ps`
- Check service logs: `docker-compose logs <service-name>`

## Production Deployment

1. **Set environment variables:**
   - `NEXT_PUBLIC_API_URL`: Production API Gateway URL
   - `JWT_SECRET`: Strong random secret
   - Database passwords
   - RabbitMQ credentials

2. **Enable HTTPS:**
   - Use reverse proxy (nginx/traefik)
   - Configure SSL certificates

3. **Monitor services:**
   - Set up health check endpoints
   - Configure logging and monitoring
   - Set up alerts

4. **Scale services:**
   - Use Docker Swarm or Kubernetes
   - Configure load balancing
   - Set up service discovery


### Source: LOCAL_SETUP.md

# Local Development Setup (Simple Database)

This guide provides a simpler setup for local development using SQLite instead of PostgreSQL.

## Option 1: SQLite with Docker (Recommended)

Use the simplified docker-compose file that uses SQLite:

```bash
# Start services with SQLite
docker compose -f docker-compose.local.yml up --build
```

This setup:
- âœ… Uses SQLite databases (no PostgreSQL containers)
- âœ… Still uses RabbitMQ and Redis
- âœ… Databases stored in `services/*/data/` directories
- âœ… Much lighter on resources

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

- âœ… No database server needed
- âœ… Faster startup
- âœ… Easier to reset (just delete .db files)
- âœ… Portable (databases are files)
- âœ… No connection strings to manage

## Disadvantages

- âŒ Not suitable for production
- âŒ Limited concurrent writes
- âŒ No advanced PostgreSQL features

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


### Source: PROJECT_STRUCTURE.md

# University Management System - Project Structure

## Overview
A modern, scalable University Management System built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. The system features role-based access control with separate dashboards for Students, Professors, and Admins.

## Project Structure

```
â”œâ”€â”€ app/                          # Next.js App Router pages
â”‚   â”œâ”€â”€ login/                    # Authentication page
â”‚   â”œâ”€â”€ student/                   # Student dashboard pages
â”‚   â”‚   â”œâ”€â”€ page.tsx              # Dashboard overview
â”‚   â”‚   â”œâ”€â”€ courses/              # Course management
â”‚   â”‚   â”œâ”€â”€ exams/                # Exam schedule
â”‚   â”‚   â”œâ”€â”€ notifications/        # Notifications center
â”‚   â”‚   â”œâ”€â”€ transcript/           # Academic transcript
â”‚   â”‚   â”œâ”€â”€ marketplace/          # Marketplace (food, dorm, events)
â”‚   â”‚   â”œâ”€â”€ cart/                 # Shopping cart
â”‚   â”‚   â”œâ”€â”€ materials/            # Course materials
â”‚   â”‚   â””â”€â”€ profile/              # User profile
â”‚   â”œâ”€â”€ professor/                 # Professor dashboard pages
â”‚   â”‚   â”œâ”€â”€ page.tsx              # Dashboard overview
â”‚   â”‚   â”œâ”€â”€ courses/              # Assigned courses
â”‚   â”‚   â”œâ”€â”€ students/             # Student management
â”‚   â”‚   â”œâ”€â”€ grades/               # Grade input
â”‚   â”‚   â”œâ”€â”€ exams/                # Exam creation
â”‚   â”‚   â”œâ”€â”€ objections/           # Grade objections
â”‚   â”‚   â”œâ”€â”€ materials/            # Material upload
â”‚   â”‚   â””â”€â”€ profile/              # User profile
â”‚   â””â”€â”€ admin/                     # Admin dashboard pages
â”‚       â”œâ”€â”€ page.tsx              # Dashboard overview
â”‚       â”œâ”€â”€ students/             # Student management
â”‚       â”œâ”€â”€ professors/           # Professor management
â”‚       â”œâ”€â”€ courses/               # Course management
â”‚       â””â”€â”€ profile/              # User profile
â”œâ”€â”€ components/                    # Reusable components
â”‚   â”œâ”€â”€ ui/                       # UI components
â”‚   â”‚   â”œâ”€â”€ Button.tsx            # Button component
â”‚   â”‚   â”œâ”€â”€ Card.tsx              # Card component
â”‚   â”‚   â”œâ”€â”€ Input.tsx             # Input component
â”‚   â”‚   â”œâ”€â”€ Table.tsx             # Table component
â”‚   â”‚   â”œâ”€â”€ Modal.tsx             # Modal component
â”‚   â”‚   â””â”€â”€ Badge.tsx             # Badge component
â”‚   â””â”€â”€ layout/                    # Layout components
â”‚       â”œâ”€â”€ Sidebar.tsx           # Sidebar navigation
â”‚       â””â”€â”€ DashboardLayout.tsx   # Dashboard layout wrapper
â”œâ”€â”€ lib/                           # Utilities and helpers
â”‚   â”œâ”€â”€ utils.ts                  # Utility functions
â”‚   â””â”€â”€ mockData.ts                # Mock data for development
â”œâ”€â”€ types/                         # TypeScript type definitions
â”‚   â””â”€â”€ index.ts                  # All type definitions
â””â”€â”€ Configuration files
    â”œâ”€â”€ package.json              # Dependencies
    â”œâ”€â”€ tsconfig.json             # TypeScript config
    â”œâ”€â”€ tailwind.config.ts        # Tailwind CSS config
    â””â”€â”€ next.config.js            # Next.js config
```

## Features by Role

### ðŸŽ“ Student Features
- **Dashboard**: Overview cards, quick access to activities
- **My Courses**: View enrolled courses, register new courses
- **Exams Schedule**: Calendar view of exam dates
- **Notifications**: Inbox-style notification center
- **Transcript**: Semester-based grades and GPA
- **Marketplace**: Reserve food, dormitory, events
- **Cart**: Manage reservations
- **Course Materials**: Download educational files

### ðŸ‘¨â€ðŸ« Professor Features
- **Dashboard**: Overview of courses, students, pending tasks
- **My Courses**: View assigned courses
- **Students**: Student list per course with search
- **Grades**: Grade input table with editable scores
- **Exam Management**: Create and manage exams (multiple choice, descriptive)
- **Objections**: Review and respond to grade objections
- **Course Materials**: Upload and manage educational files

### ðŸ›  Admin Features
- **Dashboard**: System overview statistics
- **Students Management**: Add, edit, delete students
- **Professors Management**: Add, edit, delete professors
- **Courses Management**: Create courses, assign professors

## Design System

### Color Palette
- **Primary**: University blue (`#1e40af`)
- **Accent**: Primary blue shades
- **Status Colors**: Success (green), Warning (yellow), Error (red), Info (blue)

### Components
All components follow a consistent design system:
- **Buttons**: 5 variants (primary, secondary, outline, ghost, danger)
- **Cards**: With hover effects and consistent spacing
- **Tables**: Responsive with hover states
- **Modals**: Centered with backdrop
- **Forms**: Consistent input styling with labels

### Typography
- Font: Inter (system fallback)
- Clear hierarchy with consistent sizing
- Readable line heights

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Open http://localhost:3000
   - You'll be redirected to `/login`
   - Select a role (Student, Professor, Admin) and enter any credentials

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, date-fns

## Key Design Principles

1. **Component-Based**: Reusable UI components
2. **Responsive**: Mobile-first, fully responsive
3. **Accessible**: Proper focus states, semantic HTML
4. **Modern**: Clean, minimal, professional design
5. **Scalable**: Well-organized structure for growth
6. **RTL-Ready**: Layout considerations for RTL support

## Next Steps for Implementation

1. **Backend Integration**: Connect to API endpoints
2. **Authentication**: Implement real authentication system
3. **State Management**: Add state management (Zustand/Redux) if needed
4. **Database**: Connect to database for data persistence
5. **File Upload**: Implement actual file upload functionality
6. **Real-time Updates**: Add WebSocket for notifications
7. **Testing**: Add unit and integration tests
8. **Deployment**: Deploy to production (Vercel recommended)

## Notes

- All pages use mock data for demonstration
- Authentication is simplified (role selection on login)
- File uploads are simulated
- All forms are ready for backend integration
- The design is fully responsive and ready for production styling


### Source: QUICK_START.md

# Quick Start Guide

## Simplest Setup (SQLite - No PostgreSQL)

For local development, use the simplified setup with SQLite:

```bash
# Start all services with SQLite databases
docker compose -f docker-compose.local.yml up --build
```

This will:
- âœ… Start all microservices
- âœ… Use SQLite (no PostgreSQL containers needed)
- âœ… Start RabbitMQ and Redis
- âœ… Start API Gateway

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


### Source: TROUBLESHOOTING_LOGIN.md

# Fix "Invalid Credentials" Login Error

## ðŸ”§ Quick Fix (Most Common Issue)

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

## ðŸ†• Alternative: Register a New User

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

## ðŸ” Debugging Steps

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

## ðŸš¨ Common Issues & Solutions

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

## âœ… Complete Reset (Nuclear Option)

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

## ðŸ“ Test Credentials

After seeding, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@university.edu` | `password123` |
| Student | `student@university.edu` | `password123` |
| Professor | `professor@university.edu` | `password123` |
| Seller | `seller@university.edu` | `password123` |

---

## ðŸ†˜ Still Not Working?

1. **Check browser console** for frontend errors
2. **Check network tab** to see the actual API request/response
3. **Verify API Gateway is running**: http://localhost:3001/health
4. **Test direct API call** (see Step 4 above)
5. **Check CORS** - make sure frontend URL matches `FRONTEND_URL` in gateway

If you're still stuck, share:
- Output of `docker compose ps`
- Output of `docker compose logs auth-service | tail -20`
- Response from the curl login test


### Source: VIEW_DATABASE.md

# How to View Your Local Databases

Multiple ways to view and interact with your PostgreSQL databases.

## Method 1: Command Line (psql) - Quickest

### View All Databases

```bash
# List all databases
docker compose exec auth-db psql -U postgres -l
```

### Connect to a Specific Database

```bash
# Connect to auth database
docker compose exec -it auth-db psql -U postgres -d auth_db

# Once connected, you can run SQL commands:
# \dt          - List all tables
# \d users     - Describe users table
# SELECT * FROM users;
# \q           - Quit
```

### Quick Queries (Without Interactive Mode)

```bash
# View all users
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM users;"

# Count users
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT COUNT(*) FROM users;"

# View users with formatted output
docker compose exec auth-db psql -U postgres -d auth_db -c "\x" -c "SELECT * FROM users LIMIT 1;"
```

### View All Tables

```bash
# List tables in auth database
docker compose exec auth-db psql -U postgres -d auth_db -c "\dt"

# List tables in all databases
docker compose exec auth-db psql -U postgres -c "\l"
```

---

## Method 2: GUI Tools (Recommended for Visual Browsing)

### Option A: pgAdmin (Web-based)

#### Install pgAdmin Container

Add to your `docker-compose.yml`:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
```

Then:
```bash
docker compose up -d pgadmin
```

Access at: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin`

**Connect to database:**
1. Right-click "Servers" â†’ "Create" â†’ "Server"
2. General tab: Name = "University DB"
3. Connection tab:
   - Host: `auth-db` (or `localhost` if connecting from host)
   - Port: `5432`
   - Database: `auth_db`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

### Option B: DBeaver (Desktop App)

1. **Download**: https://dbeaver.io/download/
2. **Install** DBeaver
3. **Create Connection**:
   - Click "New Database Connection"
   - Select "PostgreSQL"
   - Host: `localhost`
   - Port: `5432`
   - Database: `auth_db` (or any service database)
   - Username: `postgres`
   - Password: `postgres`
   - Click "Test Connection" then "Finish"

### Option C: VS Code Extension

1. Install extension: **"PostgreSQL"** or **"Database Client"**
2. Add connection:
   - Host: `localhost`
   - Port: `5432`
   - Database: `auth_db`
   - User: `postgres`
   - Password: `postgres`

---

## Method 3: Quick Database Viewer Script

Create a simple Node.js script to view data:

```bash
# Create viewer script
cat > view-db.js << 'EOF'
const { Pool } = require('pg');

const databases = [
  { name: 'auth_db', host: 'auth-db' },
  { name: 'resource_db', host: 'resource-db' },
  { name: 'marketplace_db', host: 'marketplace-db' },
];

async function viewDatabase(dbName, host) {
  const pool = new Pool({
    host: host,
    port: 5432,
    database: dbName,
    user: 'postgres',
    password: 'postgres',
  });

  try {
    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\nðŸ“Š Database: ${dbName}`);
    console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));

    // Show data from each table
    for (const table of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
      
      if (count.rows[0].count > 0 && count.rows[0].count < 10) {
        const data = await pool.query(`SELECT * FROM ${table.table_name} LIMIT 5`);
        console.log('    Sample data:', JSON.stringify(data.rows, null, 2));
      }
    }
  } catch (error) {
    console.error(`Error viewing ${dbName}:`, error.message);
  } finally {
    await pool.end();
  }
}

(async () => {
  for (const db of databases) {
    await viewDatabase(db.name, db.host);
  }
})();
EOF

# Run it
docker compose exec auth-service node view-db.js
```

---

## Method 4: Useful Queries

### Auth Database

```bash
# View all users
docker compose exec auth-db psql -U postgres -d auth_db -c "
SELECT id, name, email, role, tenant_id, created_at 
FROM users 
ORDER BY created_at DESC;
"

# Check user count by role
docker compose exec auth-db psql -U postgres -d auth_db -c "
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
"
```

### Resource Database

```bash
# View all resources
docker compose exec resource-db psql -U postgres -d resource_db -c "
SELECT * FROM resources;
"

# View all bookings
docker compose exec resource-db psql -U postgres -d resource_db -c "
SELECT b.*, r.name as resource_name 
FROM bookings b 
JOIN resources r ON b.resource_id = r.id 
ORDER BY b.start_time DESC;
"
```

### Marketplace Database

```bash
# View products
docker compose exec marketplace-db psql -U postgres -d marketplace_db -c "
SELECT * FROM products;
"

# View orders
docker compose exec marketplace-db psql -U postgres -d marketplace_db -c "
SELECT o.*, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
FROM orders o 
ORDER BY o.created_at DESC;
"
```

---

## Method 5: Export Data

### Export to CSV

```bash
# Export users to CSV
docker compose exec auth-db psql -U postgres -d auth_db -c "
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER
" > users.csv
```

### Export to JSON

```bash
# Export users to JSON (using psql with custom format)
docker compose exec auth-db psql -U postgres -d auth_db -t -A -F"," -c "
SELECT json_agg(row_to_json(t)) 
FROM (SELECT * FROM users) t
" > users.json
```

---

## Quick Reference Commands

```bash
# List all databases
docker compose exec auth-db psql -U postgres -l

# Connect to database (interactive)
docker compose exec -it auth-db psql -U postgres -d auth_db

# Quick query
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM users;"

# List tables
docker compose exec auth-db psql -U postgres -d auth_db -c "\dt"

# Describe table structure
docker compose exec auth-db psql -U postgres -d auth_db -c "\d users"

# View table data (formatted)
docker compose exec auth-db psql -U postgres -d auth_db -c "\x" -c "SELECT * FROM users LIMIT 1;"
```

---

## All Database Connections

| Database | Host | Port | Database Name | User | Password |
|----------|------|------|---------------|------|----------|
| Auth | `localhost` | `5432` | `auth_db` | `postgres` | `postgres` |
| Resource | `localhost` | `5432` | `resource_db` | `postgres` | `postgres` |
| Marketplace | `localhost` | `5432` | `marketplace_db` | `postgres` | `postgres` |
| E-Learning | `localhost` | `5432` | `elearning_db` | `postgres` | `postgres` |
| Notification | `localhost` | `5432` | `notification_db` | `postgres` | `postgres` |
| IoT | `localhost` | `5432` | `iot_db` | `postgres` | `postgres` |
| Shuttle | `localhost` | `5432` | `shuttle_db` | `postgres` | `postgres` |

**Note**: When connecting from outside Docker (GUI tools), use `localhost`. When connecting from inside Docker containers, use the service name (e.g., `auth-db`).

---

## VS Code Quick Access

If using VS Code, install the **"Database Client"** extension:

1. Install extension
2. Click database icon in sidebar
3. Click "+" to add connection
4. Fill in connection details (use `localhost` for host)
5. Browse tables and run queries visually

---

## Troubleshooting

### "Connection refused"

Make sure the database container is running:
```bash
docker compose ps auth-db
```

### "Database does not exist"

The database should be created automatically. If not:
```bash
docker compose exec auth-db psql -U postgres -c "CREATE DATABASE auth_db;"
```

### "Password authentication failed"

Default credentials:
- User: `postgres`
- Password: `postgres`

Check in `docker-compose.yml` if changed.

