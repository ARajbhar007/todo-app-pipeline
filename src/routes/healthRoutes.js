const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const path = require('path');

const startTime = Date.now();

// Liveness probe - checks if app is running
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe - checks if app is ready to receive traffic
router.get('/ready', (req, res) => {
  const dataDir = process.env.DATA_DIR || './data';
  const dataPath = path.resolve(dataDir);
  
  try {
    // Check if data directory is accessible
    fs.accessSync(dataPath, fs.constants.R_OK | fs.constants.W_OK);
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Data directory not accessible',
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check
router.get('/', (req, res) => {
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: {
      ms: uptime,
      human: formatUptime(uptime)
    },
    memory: {
      heapUsed: formatBytes(memoryUsage.heapUsed),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      rss: formatBytes(memoryUsage.rss)
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem())
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = router;
