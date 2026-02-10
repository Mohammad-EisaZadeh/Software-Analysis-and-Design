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
- ✅ List all courses
- ✅ Create new courses
- ✅ Edit courses
- ✅ Delete courses
- ✅ Assign professors to courses
- ✅ Auto-refresh after operations

### Student Courses Page
- ✅ View enrolled courses
- ✅ View available courses
- ✅ Enroll in courses
- ✅ Search functionality

### Professor Courses Page
- ✅ View assigned courses
- ✅ See enrolled student count

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
- `/api/courses/*` → `course-service:3009/courses/*`

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




