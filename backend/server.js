const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Import routes
const verifyRoutes = require('./routes/verify');
const usersRoutes = require('./routes/users');
const logsRoutes = require('./routes/logs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('dev'));

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========================================
// API ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DGEN Access Control API'
  });
});

// ESP32 verification endpoint (maintains compatibility)
app.use('/verify', verifyRoutes);

// User management endpoints
app.use('/api/users', usersRoutes);

// Logs endpoints
app.use('/api/logs', logsRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   DGEN Access Control System - Backend API           ║
║                                                       ║
║   Server running on: http://localhost:${PORT}       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   Status: ✓ Ready                                     ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
