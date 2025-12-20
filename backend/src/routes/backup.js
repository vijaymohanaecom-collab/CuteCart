const express = require('express');
const router = express.Router();
const backupService = require('../services/backup.service');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is admin or manager
const requireManager = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager or Admin access required' });
  }
  next();
};

/**
 * GET /api/backup/status
 * Get backup system status
 */
router.get('/status', requireManager, async (req, res) => {
  try {
    const hasDrive = backupService.driveClient !== null;
    const localBackups = backupService.listLocalBackups();
    
    let driveBackups = [];
    let driveError = null;
    if (hasDrive) {
      try {
        driveBackups = await backupService.listDriveBackups();
      } catch (driveErr) {
        if (driveErr.message?.includes('OAUTH_TOKEN_EXPIRED')) {
          driveError = 'Google Drive token expired. Please regenerate your refresh token.';
        } else {
          driveError = driveErr.message;
        }
      }
    }

    res.json({
      google_drive_enabled: hasDrive,
      google_drive_error: driveError,
      local_backup_count: localBackups.length,
      drive_backup_count: driveBackups.length,
      last_local_backup: localBackups[0] || null,
      last_drive_backup: driveBackups[0] || null
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

/**
 * POST /api/backup/create
 * Create a new backup
 */
router.post('/create', requireManager, async (req, res) => {
  try {
    console.log('Creating backup...');
    const backupInfo = await backupService.createBackup();
    
    // Cleanup old backups (keep last 7)
    await backupService.cleanupOldBackups(7);
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: backupInfo
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error.message 
    });
  }
});

/**
 * GET /api/backup/list
 * List all available backups
 */
router.get('/list', requireManager, async (req, res) => {
  try {
    const localBackups = backupService.listLocalBackups();
    let driveBackups = [];
    let driveError = null;
    
    if (backupService.driveClient) {
      try {
        driveBackups = await backupService.listDriveBackups();
      } catch (driveErr) {
        if (driveErr.message?.includes('OAUTH_TOKEN_EXPIRED')) {
          driveError = 'Google Drive token expired. Please regenerate your refresh token by running: node src/scripts/get-google-token.js';
        } else {
          driveError = driveErr.message;
        }
      }
    }

    // Combine and sort by date
    const allBackups = [...localBackups, ...driveBackups]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      backups: allBackups,
      total: allBackups.length,
      local_count: localBackups.length,
      drive_count: driveBackups.length,
      google_drive_error: driveError
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups', details: error.message });
  }
});

/**
 * DELETE /api/backup/:filename
 * Delete a specific backup
 */
router.delete('/:filename', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const backupPath = path.join(backupService.backupDir, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(backupPath);
    
    res.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

/**
 * GET /api/backup/download/:filename
 * Download a specific backup file
 */
router.get('/download/:filename', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs');
    
    const backupPath = path.join(backupService.backupDir, filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.download(backupPath, filename);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

module.exports = router;
