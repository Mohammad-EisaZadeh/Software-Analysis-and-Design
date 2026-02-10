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





