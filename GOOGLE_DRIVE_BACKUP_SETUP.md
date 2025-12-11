# Google Drive Automatic Backup Setup Guide

## Overview
Your CuteCart application already has a complete backup system implemented. This guide will help you configure automatic Google Drive backups.

## Prerequisites
✅ Google Cloud Project created
✅ Google Drive API enabled
✅ OAuth 2.0 credentials downloaded

## Step-by-Step Setup

### Step 1: Get Your Refresh Token

1. Open a terminal in the backend directory:
   ```bash
   cd d:\CuteCart-dev\backend
   ```

2. Run the refresh token generator:
   ```bash
   node get-refresh-token.js
   ```

3. The script will display a URL. Copy and paste it into your browser.

4. Sign in with your Google account and authorize the app.

5. Google will show you an authorization code. Copy it.

6. Paste the code back into the terminal when prompted.

7. The script will display your **REFRESH_TOKEN**. Copy this token.

### Step 2: Update .env File

1. Open `d:\CuteCart-dev\backend\.env`

2. Replace `YOUR_REFRESH_TOKEN_HERE` with the refresh token you just copied:
   ```
   GOOGLE_REFRESH_TOKEN=your_actual_refresh_token_here
   ```

3. (Optional) Create a specific folder in Google Drive for backups:
   - Go to Google Drive
   - Create a new folder (e.g., "CuteCart Backups")
   - Open the folder and copy the folder ID from the URL
   - Example URL: `https://drive.google.com/drive/folders/1UOQLNDA0QD3D8Itn1UwoLnZmD3T_rREW`
   - The folder ID is: `1UOQLNDA0QD3D8Itn1UwoLnZmD3T_rREW`
   - Update `GOOGLE_DRIVE_FOLDER_ID` in .env (already set to this ID)

4. Save the .env file.

### Step 3: Configure Backup Schedule

Your backup schedule is controlled by these .env variables:

```env
AUTO_BACKUP_ENABLED=true           # Enable/disable automatic backups
BACKUP_SCHEDULE=0 2 * * *          # Cron expression for schedule
BACKUP_RETENTION_COUNT=7           # Number of backups to keep
```

**Schedule Examples:**
- `0 2 * * *` - Daily at 2:00 AM (current setting)
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `*/30 * * * *` - Every 30 minutes (for testing)

### Step 4: Start Your Server

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Look for this message in the console:
   ```
   ✓ Google Drive initialized successfully
   ```

   If you see this, Google Drive is configured correctly!

### Step 5: Test the Backup System

#### Option A: Manual Backup via API

1. Make a POST request to create a backup:
   ```bash
   curl -X POST http://localhost:3000/api/backup/create \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. Check the response for backup details.

#### Option B: Check Backup Status

1. Make a GET request:
   ```bash
   curl http://localhost:3000/api/backup/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. You should see:
   ```json
   {
     "google_drive_enabled": true,
     "local_backup_count": 0,
     "drive_backup_count": 0
   }
   ```

#### Option C: Use the Frontend

If your frontend has a backup interface, you can use it to create and manage backups.

### Step 6: Verify Backups in Google Drive

1. Go to Google Drive
2. Navigate to your backup folder (or root if no folder specified)
3. You should see backup files named like: `cutecart-backup-2025-12-10T12-30-45-123Z.zip`

## How It Works

### Automatic Backups
- The system runs automatic backups based on your `BACKUP_SCHEDULE`
- Each backup creates a ZIP file containing your database
- The backup is saved locally AND uploaded to Google Drive
- Old backups are automatically cleaned up based on `BACKUP_RETENTION_COUNT`

### Backup Endpoints

Your application has these backup endpoints:

1. **GET /api/backup/status** - Check backup system status
2. **POST /api/backup/create** - Create a manual backup
3. **GET /api/backup/list** - List all available backups
4. **GET /api/backup/restore/:filename** - Restore from a backup
5. **DELETE /api/backup/:filename** - Delete a specific backup

### Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit .env file to Git** - It contains sensitive credentials
2. **Restrict API access** - Backup endpoints require admin/manager role
3. **Secure your refresh token** - Treat it like a password
4. **Use HTTPS in production** - Protect data in transit

## Troubleshooting

### Issue: "Google Drive OAuth credentials not configured"
**Solution:** Make sure all three OAuth variables are set in .env:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REFRESH_TOKEN

### Issue: "Failed to upload to Google Drive"
**Solutions:**
1. Check your refresh token is valid
2. Verify Google Drive API is enabled in Google Cloud Console
3. Check internet connectivity
4. Review server logs for detailed error messages

### Issue: Backups not running automatically
**Solutions:**
1. Verify `AUTO_BACKUP_ENABLED=true` in .env
2. Check the cron schedule syntax
3. Restart the server
4. Check server logs for scheduler messages

### Issue: "Invalid grant" error
**Solution:** Your refresh token may have expired. Re-run `get-refresh-token.js` to get a new one.

## Backup File Structure

Each backup ZIP file contains:
- `database.db` - Your SQLite database with all application data

## Monitoring Backups

Check your server logs for backup activity:
- `✓ Local backup created: [filename] ([size])`
- `✓ Backup uploaded to Google Drive: [filename]`
- `✓ Cleaned up old backups. Kept: X, Removed: Y`

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Test creating a manual backup
3. ✅ Verify the backup appears in Google Drive
4. ✅ Wait for the first automatic backup (or set schedule to `*/30 * * * *` for testing)
5. ✅ Test restoring from a backup in a development environment

## Support

If you encounter issues:
1. Check the server console logs
2. Verify all environment variables are set correctly
3. Ensure Google Drive API is enabled
4. Check that your Google account has sufficient Drive storage

---

**Last Updated:** December 10, 2025
