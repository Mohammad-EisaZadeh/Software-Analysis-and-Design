const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'elearning-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'elearning_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  try {
    const tenantId = 'tenant-1';
    const professorId = 3; // Assuming professor user ID from auth service

    const examResult = await pool.query(
      'INSERT INTO exams (title, created_by, start_time, duration, tenant_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING id',
      ['Midterm Exam - Computer Science', professorId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 90, tenantId]
    );

    let examId;
    if (examResult.rows.length > 0) {
      examId = examResult.rows[0].id;
    } else {
      const existing = await pool.query('SELECT id FROM exams WHERE tenant_id = $1 LIMIT 1', [tenantId]);
      examId = existing.rows[0].id;
    }

    const questions = [
      {
        text: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        correctOption: 1,
      },
      {
        text: 'Which data structure follows LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctOption: 1,
      },
      {
        text: 'What is the default access modifier in Java?',
        options: ['public', 'private', 'protected', 'package-private'],
        correctOption: 3,
      },
    ];

    for (const question of questions) {
      await pool.query(
        'INSERT INTO questions (exam_id, text, options, correct_option) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [examId, question.text, JSON.stringify(question.options), question.correctOption]
      );
    }

    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();





