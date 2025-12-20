const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { google } = require('googleapis');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.dbPath = path.join(__dirname, '../../database.db');
    this.driveClient = null;
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Initialize Google Drive client
   * Requires OAuth 2.0 credentials (client_id, client_secret, refresh_token)
   */
  async initializeDrive() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

      if (!clientId || !clientSecret || !refreshToken) {
        console.log('Google Drive OAuth credentials not configured. Backups will be stored locally only.');
        return false;
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3001/oauth2callback'
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      this.oauth2Client = oauth2Client;
      this.driveFolderId = folderId || 'root';
      
      // Test the credentials by making a simple API call
      try {
        await this.driveClient.files.list({ pageSize: 1 });
        console.log('✓ Google Drive initialized successfully');
        return true;
      } catch (authError) {
        if (authError.code === 401 || authError.message?.includes('invalid_grant')) {
          console.error('⚠ Google Drive OAuth token expired or invalid. Please regenerate refresh token.');
          console.error('Run: node src/scripts/get-google-token.js');
          this.driveClient = null;
          this.oauth2Client = null;
          return false;
        }
        throw authError;
      }
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error.message);
      this.driveClient = null;
      this.oauth2Client = null;
      return false;
    }
  }

  /**
   * Create a backup of the database
   * @returns {Promise<Object>} Backup information
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `cutecart-backup-${timestamp}.zip`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Create a zip archive
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          const stats = fs.statSync(backupPath);
          const backupInfo = {
            filename: backupFileName,
            path: backupPath,
            size: stats.size,
            created_at: new Date().toISOString(),
            type: 'local'
          };

          console.log(`✓ Local backup created: ${backupFileName} (${this.formatBytes(stats.size)})`);

          // Upload to Google Drive if configured
          if (this.driveClient) {
            try {
              const driveFile = await this.uploadToDrive(backupPath, backupFileName);
              backupInfo.type = 'google_drive';
              backupInfo.drive_file_id = driveFile.id;
              backupInfo.drive_file_url = driveFile.webViewLink;
              console.log(`✓ Backup uploaded to Google Drive: ${driveFile.name}`);
            } catch (driveError) {
              console.error('Failed to upload to Google Drive:', driveError.message);
              backupInfo.drive_error = driveError.message;
            }
          }

          resolve(backupInfo);
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add database file
        if (fs.existsSync(this.dbPath)) {
          archive.file(this.dbPath, { name: 'database.db' });
        } else {
          throw new Error('Database file not found');
        }

        // Add environment files if they exist
        const envProdPath = path.join(__dirname, '../../.env.production');
        const envDevPath = path.join(__dirname, '../../.env.development');
        
        if (fs.existsSync(envProdPath)) {
          archive.file(envProdPath, { name: '.env.production' });
        }
        if (fs.existsSync(envDevPath)) {
          archive.file(envDevPath, { name: '.env.development' });
        }

        archive.finalize();
      });
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Upload backup file to Google Drive
   * @param {string} filePath - Path to the backup file
   * @param {string} fileName - Name of the file
   * @returns {Promise<Object>} Drive file metadata
   */
  async uploadToDrive(filePath, fileName) {
    if (!this.driveClient) {
      throw new Error('Google Drive not initialized');
    }

    const fileMetadata = {
      name: fileName,
      parents: [this.driveFolderId]
    };

    const media = {
      mimeType: 'application/zip',
      body: fs.createReadStream(filePath)
    };

    const response = await this.driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, size, createdTime'
    });

    return response.data;
  }

  /**
   * List all local backups
   * @returns {Array} List of backup files
   */
  listLocalBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(file => file.startsWith('cutecart-backup-') && file.endsWith('.zip'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created_at: stats.birthtime.toISOString(),
            type: 'local'
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * List backups from Google Drive
   * @returns {Promise<Array>} List of backup files from Drive
   */
  async listDriveBackups() {
    if (!this.driveClient) {
      return [];
    }

    try {
      const response = await this.driveClient.files.list({
        q: `name contains 'cutecart-backup-' and '${this.driveFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 50
      });

      return response.data.files.map(file => ({
        filename: file.name,
        drive_file_id: file.id,
        drive_file_url: file.webViewLink,
        size: parseInt(file.size),
        created_at: file.createdTime,
        type: 'google_drive'
      }));
    } catch (error) {
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        console.error('⚠ Google Drive token expired. Disabling Drive integration.');
        this.driveClient = null;
        this.oauth2Client = null;
        throw new Error('OAUTH_TOKEN_EXPIRED: Please regenerate your Google Drive refresh token');
      }
      console.error('Failed to list Drive backups:', error.message);
      throw error;
    }
  }

  /**
   * Delete old backups (keep only last N backups)
   * @param {number} keepCount - Number of backups to keep
   */
  async cleanupOldBackups(keepCount = 7) {
    try {
      const localBackups = this.listLocalBackups();
      
      // Delete old local backups
      if (localBackups.length > keepCount) {
        const toDelete = localBackups.slice(keepCount);
        for (const backup of toDelete) {
          fs.unlinkSync(backup.path);
          console.log(`✓ Deleted old backup: ${backup.filename}`);
        }
      }

      // Delete old Drive backups
      if (this.driveClient) {
        const driveBackups = await this.listDriveBackups();
        if (driveBackups.length > keepCount) {
          const toDelete = driveBackups.slice(keepCount);
          for (const backup of toDelete) {
            await this.driveClient.files.delete({ fileId: backup.drive_file_id });
            console.log(`✓ Deleted old Drive backup: ${backup.filename}`);
          }
        }
      }

      console.log(`✓ Cleanup complete. Keeping ${keepCount} most recent backups.`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Download backup from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @param {string} destinationPath - Where to save the file
   */
  async downloadFromDrive(fileId, destinationPath) {
    if (!this.driveClient) {
      throw new Error('Google Drive not initialized');
    }

    const dest = fs.createWriteStream(destinationPath);
    const response = await this.driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      response.data
        .on('end', () => {
          console.log(`✓ Downloaded backup from Drive`);
          resolve();
        })
        .on('error', reject)
        .pipe(dest);
    });
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   */
  async restoreFromBackup(backupPath) {
    // This is a critical operation - should be implemented with caution
    // For now, we'll just provide the backup file path
    // Actual restoration should be done manually or with explicit confirmation
    throw new Error('Restore functionality should be performed manually for safety');
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes 
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = new BackupService();
