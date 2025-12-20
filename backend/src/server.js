require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Allow CORS for local and network access
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost and any IP address on port 4200
    const allowedOrigins = [
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ];

    // Allow any origin from local network (192.168.x.x or 10.x.x.x)
    if (origin.match(/^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):4200$/)) {
      return callback(null, true);
    }

    // For debugging - allow all origins temporarily
    console.log('CORS Origin:', origin);
    callback(null, true); // Allow all origins for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize database
initDatabase();

// Initialize backup service and scheduler
const backupService = require('./services/backup.service');
const { scheduleBackups } = require('./jobs/backup.job');

// Initialize Google Drive (if configured)
backupService.initializeDrive().then(async () => {
  // Schedule automatic backups
  scheduleBackups();
  
  // Create backup on startup (if enabled)
  if (process.env.BACKUP_ON_STARTUP === 'true') {
    try {
      console.log('Creating startup backup...');
      const backupInfo = await backupService.createBackup();
      console.log(`✓ Startup backup created: ${backupInfo.filename}`);
    } catch (error) {
      console.error('Failed to create startup backup:', error.message);
    }
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', authenticateToken, require('./routes/products'));
app.use('/api/invoices', authenticateToken, require('./routes/invoices'));
app.use('/api/users', authenticateToken, require('./routes/users'));
app.use('/api/settings', authenticateToken, require('./routes/settings'));
app.use('/api/expenses', authenticateToken, require('./routes/expenses'));
app.use('/api/other-income', authenticateToken, require('./routes/other-income'));
app.use('/api/cash-register', authenticateToken, require('./routes/cash-register'));
app.use('/api/staff', authenticateToken, require('./routes/staff'));
app.use('/api/attendance', authenticateToken, require('./routes/attendance'));
app.use('/api/backup', authenticateToken, require('./routes/backup'));
app.use('/api/reports', authenticateToken, require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Access from network: http://<your-ip>:${PORT}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received.`);
  
  // Create backup on shutdown (if enabled)
  if (process.env.BACKUP_ON_SHUTDOWN === 'true') {
    console.log('Creating shutdown backup...');
    try {
      const backupInfo = await backupService.createBackup();
      console.log(`✓ Shutdown backup created: ${backupInfo.filename}`);
    } catch (error) {
      console.error('Failed to create shutdown backup:', error.message);
    }
  }
  
  console.log('Closing server...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Windows Ctrl+C
if (process.platform === 'win32') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}
