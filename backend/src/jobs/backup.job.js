const cron = require('node-cron');
const backupService = require('../services/backup.service');

/**
 * Schedule automatic backups
 * Default: Daily at 2:00 AM
 */
function scheduleBackups() {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Default: 2 AM daily
  const enabled = process.env.AUTO_BACKUP_ENABLED !== 'false'; // Default: enabled

  if (!enabled) {
    console.log('⚠ Automatic backups are disabled');
    return;
  }

  console.log(`✓ Scheduling automatic backups: ${schedule}`);

  cron.schedule(schedule, async () => {
    try {
      console.log('🔄 Starting scheduled backup...');
      const backupInfo = await backupService.createBackup();
      
      // Cleanup old backups (keep last 7)
      const keepCount = parseInt(process.env.BACKUP_RETENTION_COUNT) || 7;
      await backupService.cleanupOldBackups(keepCount);
      
      console.log('✓ Scheduled backup completed successfully');
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
    }
  });

  console.log('✓ Backup scheduler initialized');
}

/**
 * Run backup immediately (for testing)
 */
async function runBackupNow() {
  try {
    console.log('🔄 Running manual backup...');
    const backupInfo = await backupService.createBackup();
    await backupService.cleanupOldBackups(7);
    console.log('✓ Manual backup completed');
    return backupInfo;
  } catch (error) {
    console.error('❌ Manual backup failed:', error);
    throw error;
  }
}

module.exports = {
  scheduleBackups,
  runBackupNow
};
