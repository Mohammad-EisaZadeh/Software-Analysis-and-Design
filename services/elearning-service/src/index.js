const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const CircuitBreaker = require('./circuitBreaker');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

const pool = new Pool({
  host: process.env.DB_HOST || 'elearning-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'elearning_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Circuit breaker for notification service
const notificationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_by INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        answers JSONB NOT NULL,
        score DECIMAL(5,2),
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_exams_tenant ON exams(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_tenant ON submissions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

app.use(cors());
app.use(express.json());

const extractUserInfo = (req, res, next) => {
  req.userId = parseInt(req.headers['x-user-id']);
  req.userRole = req.headers['x-role'];
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// Helper to call notification service with circuit breaker
const notifyUser = async (userId, message, tenantId) => {
  try {
    await notificationCircuitBreaker.execute(async () => {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006'}/notify`,
        { userId, message },
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
          timeout: 5000,
        }
      );
    });
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.warn(`Notification service unavailable (circuit breaker: ${notificationCircuitBreaker.getState().state}):`, error.message);
    // Continue execution even if notification fails
  }
};

// POST /exams (professor only)
app.post('/exams', extractUserInfo, async (req, res) => {
  try {
    if (req.userRole !== 'professor') {
      return res.status(403).json({ error: 'Forbidden: Professor access required' });
    }

    const { title, startTime, duration, questions } = req.body;

    if (!title || !startTime || !duration || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Title, startTime, duration, and questions array are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const examResult = await client.query(
        'INSERT INTO exams (title, created_by, start_time, duration, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, req.userId, startTime, duration, req.tenantId]
      );

      const examId = examResult.rows[0].id;

      for (const question of questions) {
        await client.query(
          'INSERT INTO questions (exam_id, text, options, correct_option) VALUES ($1, $2, $3, $4)',
          [examId, question.text, JSON.stringify(question.options), question.correctOption]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        ...examResult.rows[0],
        questionsCount: questions.length,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /exams
app.get('/exams', extractUserInfo, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, COUNT(q.id) as questions_count
       FROM exams e
       LEFT JOIN questions q ON e.id = q.exam_id
       WHERE e.tenant_id = $1
       GROUP BY e.id
       ORDER BY e.start_time DESC`,
      [req.tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /exams/:id/start
app.post('/exams/:id/start', extractUserInfo, async (req, res) => {
  try {
    const examId = parseInt(req.params.id);

    // Get exam
    const exam = await pool.query(
      'SELECT * FROM exams WHERE id = $1 AND tenant_id = $2',
      [examId, req.tenantId]
    );

    if (exam.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if already started
    const existing = await pool.query(
      'SELECT * FROM submissions WHERE exam_id = $1 AND user_id = $2 AND tenant_id = $3',
      [examId, req.userId, req.tenantId]
    );

    if (existing.rows.length > 0 && existing.rows[0].submitted_at) {
      return res.status(400).json({ error: 'Exam already submitted' });
    }

    // Create or update submission
    let submission;
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE submissions SET started_at = CURRENT_TIMESTAMP WHERE id = $1',
        [existing.rows[0].id]
      );
      submission = existing.rows[0];
    } else {
      const result = await pool.query(
        'INSERT INTO submissions (exam_id, user_id, answers, started_at, tenant_id) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *',
        [examId, req.userId, JSON.stringify({}), req.tenantId]
      );
      submission = result.rows[0];
    }

    // Get questions
    const questions = await pool.query(
      'SELECT id, text, options FROM questions WHERE exam_id = $1',
      [examId]
    );

    // Call notification service with circuit breaker
    await notifyUser(
      req.userId,
      `You have started exam: ${exam.rows[0].title}`,
      req.tenantId
    );

    res.json({
      exam: exam.rows[0],
      submission,
      questions: questions.rows.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
      })),
    });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /exams/:id/submit
app.post('/exams/:id/submit', extractUserInfo, async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object is required' });
    }

    // Get exam and questions
    const exam = await pool.query(
      'SELECT * FROM exams WHERE id = $1 AND tenant_id = $2',
      [examId, req.tenantId]
    );

    if (exam.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const questions = await pool.query(
      'SELECT id, correct_option FROM questions WHERE exam_id = $1',
      [examId]
    );

    // Calculate score
    let correctCount = 0;
    for (const question of questions.rows) {
      if (answers[question.id] === question.correct_option) {
        correctCount++;
      }
    }

    const score = (correctCount / questions.rows.length) * 100;

    // Update submission
    const result = await pool.query(
      `UPDATE submissions 
       SET answers = $1, score = $2, submitted_at = CURRENT_TIMESTAMP 
       WHERE exam_id = $3 AND user_id = $4 AND tenant_id = $5 
       RETURNING *`,
      [JSON.stringify(answers), score, examId, req.userId, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Notify user with circuit breaker
    await notifyUser(
      req.userId,
      `Your exam "${exam.rows[0].title}" has been submitted. Score: ${score.toFixed(2)}%`,
      req.tenantId
    );

    res.json({
      submission: result.rows[0],
      score: score.toFixed(2),
      correctAnswers: correctCount,
      totalQuestions: questions.rows.length,
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /circuit-breaker/status
app.get('/circuit-breaker/status', (req, res) => {
  res.json(notificationCircuitBreaker.getState());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'elearning-service' });
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Learning service running on port ${PORT}`);
  });
});





