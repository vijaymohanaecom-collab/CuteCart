# Backup System Behavior

## Overview
Your CuteCart backup system now creates backups at multiple points to ensure data safety.

## Backup Triggers

### 1. **Startup Backup** ✅
- **When:** Every time the server starts
- **Why:** Captures the current state before any new operations
- **Config:** `BACKUP_ON_STARTUP=true`

### 2. **Shutdown Backup** ✅
- **When:** When the server is stopped (Ctrl+C, SIGTERM, SIGINT)
- **Why:** Captures all changes made during the session
- **Config:** `BACKUP_ON_SHUTDOWN=true`

### 3. **Scheduled Backup** ✅
- **When:** Based on cron schedule (default: 2:00 AM daily)
- **Why:** Regular automated backups
- **Config:** `BACKUP_SCHEDULE=0 2 * * *`

### 4. **Manual Backup** ✅
- **When:** On-demand via API or script
- **How:** 
  - API: `POST /api/backup/create`
  - Script: `node test-backup.js`

## Configuration (.env)

```env
# Enable/disable automatic backups
AUTO_BACKUP_ENABLED=true

# Cron schedule for automatic backups
BACKUP_SCHEDULE=0 2 * * *

# Number of backups to keep
BACKUP_RETENTION_COUNT=7

# Create backup when server starts
BACKUP_ON_STARTUP=true

# Create backup when server stops
BACKUP_ON_SHUTDOWN=true
```

## Backup Flow

```
Server Start
    ↓
Initialize Google Drive
    ↓
Create Startup Backup ← (if BACKUP_ON_STARTUP=true)
    ↓
Start Scheduler
    ↓
[Server Running]
    ↓
Scheduled Backups ← (based on BACKUP_SCHEDULE)
    ↓
[Shutdown Signal Received]
    ↓
Create Shutdown Backup ← (if BACKUP_ON_SHUTDOWN=true)
    ↓
Close Server
```

## Storage Locations

1. **Local:** `d:\CuteCart-dev\backend\backups\`
2. **Google Drive:** Folder ID `1UOQLNDA0QD3D8Itn1UwoLnZmD3T_rREW`

## Backup Retention

- Keeps the last `BACKUP_RETENTION_COUNT` backups (default: 7)
- Older backups are automatically deleted
- Applies to both local and Google Drive storage

## Advantages of This Setup

### ✅ **No Missed Backups**
Even if your system is off at the scheduled time, you still get:
- Backup when you start the server
- Backup when you stop the server

### ✅ **Session Protection**
Every work session is bookmarked:
- **Start:** Captures state before changes
- **End:** Captures all changes made

### ✅ **Flexible Schedule**
You can still use scheduled backups for additional safety

### ✅ **Always Up-to-Date**
Your most recent backup is never more than one session old

## Example Scenarios

### Scenario 1: Daily Use
```
9:00 AM  - Start server → Startup backup created
5:00 PM  - Stop server  → Shutdown backup created
```
**Result:** 2 backups per day (start + end of work)

### Scenario 2: Multiple Sessions
```
9:00 AM  - Start server → Backup #1
12:00 PM - Restart      → Backup #2 (shutdown) + Backup #3 (startup)
5:00 PM  - Stop server  → Backup #4
```
**Result:** 4 backups capturing every session

### Scenario 3: Overnight Running
```
9:00 AM  - Start server  → Startup backup
2:00 AM  - Scheduled     → Automatic backup
9:00 AM  - Stop server   → Shutdown backup
```
**Result:** 3 backups (startup + scheduled + shutdown)

## Disabling Specific Backups

If you want to disable certain backup triggers:

```env
# Only scheduled backups
BACKUP_ON_STARTUP=false
BACKUP_ON_SHUTDOWN=false
BACKUP_SCHEDULE=0 2 * * *

# Only startup/shutdown backups
BACKUP_ON_STARTUP=true
BACKUP_ON_SHUTDOWN=true
AUTO_BACKUP_ENABLED=false

# All backups disabled
AUTO_BACKUP_ENABLED=false
BACKUP_ON_STARTUP=false
BACKUP_ON_SHUTDOWN=false
```

## Testing

Test the new behavior:

```bash
# Test startup backup
npm run dev
# Check console for "✓ Startup backup created"

# Test shutdown backup
# Press Ctrl+C
# Check console for "✓ Shutdown backup created"

# Test manual backup
node test-backup.js
```

## Troubleshooting

### Startup backup not created
- Check `BACKUP_ON_STARTUP=true` in .env
- Check server console for errors
- Verify Google Drive credentials

### Shutdown backup not created
- Check `BACKUP_ON_SHUTDOWN=true` in .env
- Use Ctrl+C (not force kill)
- Allow 10 seconds for graceful shutdown

### Too many backups
- Reduce `BACKUP_RETENTION_COUNT`
- Disable startup/shutdown backups if not needed

---

**Your backup system is now fully automated and resilient!** 🎉
