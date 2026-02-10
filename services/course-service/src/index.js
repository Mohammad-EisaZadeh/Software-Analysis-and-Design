const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3009;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'course-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'course_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Initialize database
const initDB = async () => {
  const client = await pool.connect();
  try {
    // Courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        professor_id INTEGER,
        credits INTEGER NOT NULL DEFAULT 3,
        semester VARCHAR(50) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(code, tenant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_courses_professor ON courses(professor_id);
    `);

    // Enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, student_id, tenant_id)
      );
      CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON enrollments(tenant_id);
    `);

    console.log('Course database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json());

// Middleware to extract user info from headers (set by gateway)
const extractUserInfo = (req, res, next) => {
  req.userId = parseInt(req.headers['x-user-id']);
  req.userRole = req.headers['x-role'];
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// GET /courses - List all courses (filtered by tenant)
app.get('/courses', extractUserInfo, async (req, res) => {
  try {
    const { professorId, studentId } = req.query;
    let query = `
      SELECT 
        c.id,
        c.code,
        c.name,
        c.professor_id,
        c.credits,
        c.semester,
        c.tenant_id,
        c.created_at,
        COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND c.tenant_id = e.tenant_id
      WHERE c.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (professorId) {
      query += ' AND c.professor_id = $2';
      params.push(professorId);
    }

    if (studentId) {
      query += ` AND c.id IN (SELECT course_id FROM enrollments WHERE student_id = $${params.length + 1} AND tenant_id = $1)`;
      params.push(studentId);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);

    const courses = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      professorId: row.professor_id,
      credits: row.credits,
      semester: row.semester,
      enrolledStudents: parseInt(row.enrolled_students) || 0,
      createdAt: row.created_at,
    }));

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /courses/my - Get courses for current user
app.get('/courses/my', extractUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query = '';
    const params = [req.tenantId];

    if (req.userRole === 'professor') {
      query = `
        SELECT 
          c.id,
          c.code,
          c.name,
          c.professor_id,
          c.credits,
          c.semester,
          c.tenant_id,
          c.created_at,
          COUNT(e.id) as enrolled_students
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id AND c.tenant_id = e.tenant_id
        WHERE c.tenant_id = $1 AND c.professor_id = $2
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      params.push(req.userId);
    } else if (req.userRole === 'student') {
      query = `
        SELECT 
          c.id,
          c.code,
          c.name,
          c.professor_id,
          c.credits,
          c.semester,
          c.tenant_id,
          c.created_at
        FROM courses c
        INNER JOIN enrollments e ON c.id = e.course_id AND c.tenant_id = e.tenant_id
        WHERE c.tenant_id = $1 AND e.student_id = $2
        ORDER BY c.created_at DESC
      `;
      params.push(req.userId);
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(query, params);

    const courses = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      professorId: row.professor_id,
      credits: row.credits,
      semester: row.semester,
      enrolled: true,
      enrolledStudents: parseInt(row.enrolled_students) || 0,
      createdAt: row.created_at,
    }));

    res.json(courses);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /courses/:id - Get course details
app.get('/courses/:id', extractUserInfo, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.code,
        c.name,
        c.professor_id,
        c.credits,
        c.semester,
        c.tenant_id,
        c.created_at,
        COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND c.tenant_id = e.tenant_id
      WHERE c.id = $1 AND c.tenant_id = $2
      GROUP BY c.id`,
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const row = result.rows[0];
    const course = {
      id: row.id,
      code: row.code,
      name: row.name,
      professorId: row.professor_id,
      credits: row.credits,
      semester: row.semester,
      enrolledStudents: parseInt(row.enrolled_students) || 0,
      createdAt: row.created_at,
    };

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /courses - Create course (admin only)
app.post('/courses', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { code, name, professorId, credits, semester } = req.body;

    if (!code || !name || !credits || !semester) {
      return res.status(400).json({ error: 'Code, name, credits, and semester are required' });
    }

    const result = await pool.query(
      `INSERT INTO courses (code, name, professor_id, credits, semester, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, name, professor_id, credits, semester, tenant_id, created_at`,
      [code, name, professorId || null, credits, semester, req.tenantId]
    );

    const course = result.rows[0];
    res.status(201).json({
      id: course.id,
      code: course.code,
      name: course.name,
      professorId: course.professor_id,
      credits: course.credits,
      semester: course.semester,
      createdAt: course.created_at,
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Course code already exists for this tenant' });
    }
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /courses/:id - Update course (admin only)
app.put('/courses/:id', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { code, name, professorId, credits, semester } = req.body;

    const result = await pool.query(
      `UPDATE courses 
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           professor_id = COALESCE($3, professor_id),
           credits = COALESCE($4, credits),
           semester = COALESCE($5, semester)
       WHERE id = $6 AND tenant_id = $7
       RETURNING id, code, name, professor_id, credits, semester, tenant_id, created_at`,
      [code, name, professorId, credits, semester, id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = result.rows[0];
    res.json({
      id: course.id,
      code: course.code,
      name: course.name,
      professorId: course.professor_id,
      credits: course.credits,
      semester: course.semester,
      createdAt: course.created_at,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /courses/:id - Delete course (admin only)
app.delete('/courses/:id', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /courses/:id/enroll - Enroll student in course
app.post('/courses/:id/enroll', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    const { id } = req.params;

    // Check if course exists
    const courseCheck = await pool.query(
      'SELECT id FROM courses WHERE id = $1 AND tenant_id = $2',
      [id, req.tenantId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await pool.query(
      'SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2 AND tenant_id = $3',
      [id, req.userId, req.tenantId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Enroll student
    await pool.query(
      'INSERT INTO enrollments (course_id, student_id, tenant_id) VALUES ($1, $2, $3)',
      [id, req.userId, req.tenantId]
    );

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'course-service' });
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Course service running on port ${PORT}`);
  });
});

