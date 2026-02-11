const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// SQLite database
const dbPath = path.join(__dirname, '../../data/auth.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
const initDB = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
    console.log('SQLite database initialized');

    // Automatically create admin user if none exists
    db.get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'], async (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        return;
      }

      if (!row) {
        const passwordHash = await bcrypt.hash('password123', 10);
        db.run(
          'INSERT OR IGNORE INTO users (name, email, password_hash, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
          ['Admin User', 'admin@university.edu', passwordHash, 'admin', 'tenant-1'],
          function(err) {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('✅ Initial admin user created: admin@university.edu / password123');
            }
          }
        );
      } else {
        console.log('✅ Admin user already exists');
      }
    });
  });
};

app.use(cors());
app.use(express.json());

// Middleware to extract user info from headers
const extractUserInfo = (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  req.userRole = req.headers['x-role'];
  req.tenantId = req.headers['x-tenant-id'];
  next();
};

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, tenantId } = req.body;

    if (!name || !email || !password || !role || !tenantId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const validRoles = ['student', 'professor', 'seller', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (name, email, password_hash, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
        [name, email, passwordHash, role.toLowerCase(), tenantId],
        function(err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          const token = jwt.sign(
            { userId: this.lastID, role: role.toLowerCase(), tenantId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

          res.status(201).json({
            message: 'User registered successfully',
            user: {
              id: this.lastID,
              name,
              email,
              role: role.toLowerCase(),
              tenantId,
            },
            accessToken: token,
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get(
      'SELECT id, name, email, password_hash, role, tenant_id FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id, role: user.role, tenantId: user.tenant_id },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
          accessToken: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
          },
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/me
app.get('/users/me', extractUserInfo, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.get(
    'SELECT id, name, email, role, tenant_id, created_at FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        createdAt: user.created_at,
      });
    }
  );
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', db: 'sqlite' });
});

// Initialize and start
initDB();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service (SQLite) running on port ${PORT}`);
});




