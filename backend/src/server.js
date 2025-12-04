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
backupService.initializeDrive().then(() => {
  // Schedule automatic backups
  scheduleBackups();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', authenticateToken, require('./routes/products'));
app.use('/api/invoices', authenticateToken, require('./routes/invoices'));
app.use('/api/users', authenticateToken, require('./routes/users'));
app.use('/api/settings', authenticateToken, require('./routes/settings'));
app.use('/api/expenses', authenticateToken, require('./routes/expenses'));
app.use('/api/staff', authenticateToken, require('./routes/staff'));
app.use('/api/attendance', authenticateToken, require('./routes/attendance'));
app.use('/api/backup', authenticateToken, require('./routes/backup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Access from network: http://<your-ip>:${PORT}`);
});
