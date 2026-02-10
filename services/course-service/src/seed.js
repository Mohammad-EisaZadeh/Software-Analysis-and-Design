const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'course-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'course_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const seedCourses = async () => {
  const client = await pool.connect();
  try {
    // Note: This assumes professors exist in auth service
    // In a real scenario, you'd fetch professor IDs from auth service
    const tenantId = 'tenant-1';

    const courses = [
      {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        professorId: null, // Will be assigned later
        credits: 3,
        semester: 'Fall 2024',
      },
      {
        code: 'MATH201',
        name: 'Calculus II',
        professorId: null,
        credits: 4,
        semester: 'Fall 2024',
      },
      {
        code: 'ENG102',
        name: 'Advanced English Composition',
        professorId: null,
        credits: 3,
        semester: 'Fall 2024',
      },
    ];

    for (const course of courses) {
      await client.query(
        `INSERT INTO courses (code, name, professor_id, credits, semester, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code, tenant_id) DO NOTHING`,
        [course.code, course.name, course.professorId, course.credits, course.semester, tenantId]
      );
    }

    console.log('Courses seeded successfully');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

seedCourses();




