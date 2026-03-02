const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const todoRoutes = require('./routes/todoRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { initializeStorage } = require('./utils/storage');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for simple frontend
}));
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize persistent storage
initializeStorage(DATA_DIR);

// API Routes
app.use('/api/todos', todoRoutes);
app.use('/api/health', healthRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Performing graceful shutdown...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Todo App server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

module.exports = app;
