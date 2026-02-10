const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Service URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
  resources: process.env.RESOURCES_SERVICE_URL || 'http://resource-service:3003',
  marketplace: process.env.MARKETPLACE_SERVICE_URL || 'http://marketplace-service:3004',
  elearning: process.env.ELEARNING_SERVICE_URL || 'http://elearning-service:3005',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://notification-service:3006',
  iot: process.env.IOT_SERVICE_URL || 'http://iot-service:3007',
  shuttle: process.env.SHUTTLE_SERVICE_URL || 'http://shuttle-service:3008',
  courses: process.env.COURSE_SERVICE_URL || 'http://course-service:3009',
};

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Auth service routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onProxyReq: (proxyReq, req) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));

// User service routes (protected)
app.use('/api/users', verifyToken, createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// Resource service routes
app.use('/api/resources', verifyToken, createProxyMiddleware({
  target: SERVICES.resources,
  changeOrigin: true,
  pathRewrite: { '^/api/resources': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// Marketplace service routes
app.use('/api/marketplace', verifyToken, createProxyMiddleware({
  target: SERVICES.marketplace,
  changeOrigin: true,
  pathRewrite: { '^/api/marketplace': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// E-Learning service routes
app.use('/api/elearning', verifyToken, createProxyMiddleware({
  target: SERVICES.elearning,
  changeOrigin: true,
  pathRewrite: { '^/api/elearning': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// Notification service routes (internal, but accessible via gateway)
app.use('/api/notifications', verifyToken, createProxyMiddleware({
  target: SERVICES.notifications,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// IoT service routes
app.use('/api/iot', verifyToken, createProxyMiddleware({
  target: SERVICES.iot,
  changeOrigin: true,
  pathRewrite: { '^/api/iot': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// Shuttle service routes
app.use('/api/shuttle', verifyToken, createProxyMiddleware({
  target: SERVICES.shuttle,
  changeOrigin: true,
  pathRewrite: { '^/api/shuttle': '' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

// Course service routes
app.use('/api/courses', verifyToken, createProxyMiddleware({
  target: SERVICES.courses,
  changeOrigin: true,
  pathRewrite: { '^/api/courses': '/courses' },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-Role', req.user.role);
    proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});


