# Cash Register Automation System

## Overview

The cash register automation system provides the following features:

1. **Auto-close yesterday's register** - Automatically closes unclosed registers at midnight with expected cash balance
2. **Auto-open today's register** - Automatically opens today's register with yesterday's closing balance
3. **Backdated expense adjustment** - Automatically adjusts cash registers when backdated expenses are added/modified/deleted
4. **Notifications** - Sends notifications for all automatic actions
5. **User editing** - Allows managers to edit auto-closed entries to correct any discrepancies

## Installation & Setup

### 1. Run Database Migration

```bash
cd backend
node src/database/migrate-cash-register-automation.js
```

This will:
- Add `status`, `is_auto_closed`, and `is_auto_opened` columns to the cash_register table
- Create the notifications table
- Create necessary indexes

### 2. Restart the Backend Server

```bash
npm run dev
# or
npm start
```

The automation scheduler will start automatically when the server starts.

## Features

### 0. Startup Automation Check

**When:** Every time the server starts

**What it does:**
- Checks if yesterday's register is still open and closes it if needed
- Checks if today's register needs to be opened and opens it if needed
- Ensures automation runs even if server was down at midnight
- Logs all actions to console for visibility

**Why it's important:**
If your server is restarted, turned off overnight, or experiences downtime, the scheduled midnight automation won't run. The startup check ensures that:
- Yesterday's register gets closed with the correct balance
- Today's register opens with yesterday's closing balance
- No manual intervention is needed

### 1. Automatic Register Closing

**When:** Every day at midnight (12:00 AM IST)

**What it does:**
- Checks if yesterday's cash register is still open
- Calculates expected closing cash based on:
  - Opening cash
  - Cash sales for the day
  - Cash expenses for the day
- Closes the register with expected closing cash
- Sets `is_auto_closed = 1` and `status = 'closed'`
- Creates a notification for users to verify

**Status Display:**
- Auto-closed registers show a purple "Auto-Closed" badge
- Warning message prompts managers to verify and edit if needed

### 2. Automatic Register Opening

**When:** Every day at midnight (12:00 AM IST)

**What it does:**
- Checks if today's cash register is already open
- If not, creates a new entry with:
  - Opening cash = Yesterday's closing cash (or 0 if no previous entry)
  - Sets `is_auto_opened = 1`
- Creates a notification for users

**Status Display:**
- Auto-opened registers show an info banner at the top
- Users can edit the opening cash if needed

### 3. Backdated Expense Adjustment

**When:** Whenever an expense is created, updated, or deleted

**What it does:**
- Detects if the expense date is in the past
- Checks if a cash register entry exists for that date
- Recalculates expected closing cash
- Updates the difference
- Creates a notification about the adjustment

**Affected Operations:**
- Creating a new expense with a past date
- Updating an expense's date, amount, or payment method
- Deleting an expense from a past date

### 4. Notifications

All automatic actions generate notifications that include:
- Type of action (auto-closed, auto-opened, adjusted)
- Date affected
- New balance/difference
- Timestamp

**Notification Types:**
- `cash_register_auto_closed` - Register was automatically closed
- `cash_register_auto_opened` - Register was automatically opened
- `cash_register_adjusted` - Register was adjusted due to backdated expense

**API Endpoints:**
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### 5. User Editing

**Manager Permissions Required**

Managers can edit any cash register entry, including auto-closed ones:
- Click "Edit" button on any entry in the history table
- Modify opening cash, closing cash, or notes
- System recalculates expected closing and difference
- Warning shown for auto-closed entries

## Manual Triggers (For Testing)

You can manually trigger automation via API:

```bash
# Run full daily automation (auto-close yesterday + auto-open today)
POST /api/cash-register/automation/run

# Auto-close yesterday's register only
POST /api/cash-register/automation/auto-close-yesterday

# Auto-open today's register only
POST /api/cash-register/automation/auto-open-today
```

## Scheduled Job Configuration

The automation runs daily at midnight IST (Asia/Kolkata timezone).

**Configuration:** `backend/src/jobs/cash-register.job.js`

```javascript
cron.schedule('0 0 * * *', async () => {
  // Runs at 00:00 every day
}, {
  timezone: 'Asia/Kolkata'
});
```

To change the schedule, modify the cron expression:
- `0 0 * * *` - Midnight every day
- `0 1 * * *` - 1:00 AM every day
- `30 23 * * *` - 11:30 PM every day

## Database Schema Changes

### cash_register table (new columns)

```sql
status TEXT DEFAULT 'open'           -- 'open' or 'closed'
is_auto_closed INTEGER DEFAULT 0     -- 1 if auto-closed, 0 if manually closed
is_auto_opened INTEGER DEFAULT 0     -- 1 if auto-opened, 0 if manually opened
```

### notifications table (new)

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_date TEXT,
  related_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Frontend Changes

### Cash Register Component

**New Features:**
- Purple "Auto-Closed" badge for auto-closed registers
- Blue info banner for auto-opened registers
- Warning message prompting verification of auto-closed entries
- Edit button for all entries (manager only)
- Edit modal with warning for auto-closed entries

**Visual Indicators:**
- 🤖 Auto-Closed badge (purple)
- ℹ️ Auto-opened notice (blue)
- ⚠️ Warning for auto-closed entries (yellow)

### API Service

**New Methods:**
```typescript
runCashRegisterAutomation()
autoCloseYesterday()
autoOpenToday()
getNotifications(limit?)
getUnreadNotifications()
markNotificationAsRead(id)
markAllNotificationsAsRead()
deleteNotification(id)
```

## Troubleshooting

### Automation not running

1. Check if server is running
2. Check console logs for scheduler initialization message
3. Verify `node-cron` is installed: `npm list node-cron`

### Notifications not appearing

1. Check if notifications table exists
2. Run migration script again if needed
3. Check API endpoint: `GET /api/notifications/unread`

### Auto-close using wrong balance

1. Verify cash sales and expenses are correctly recorded
2. Check if payment methods are set correctly (cash vs other)
3. Use edit feature to correct the balance

### Backdated expenses not adjusting

1. Ensure expense date is in the past
2. Check if cash register entry exists for that date
3. Verify payment method is set to 'cash'

## Best Practices

1. **Daily Review:** Check notifications daily to verify auto-closed entries
2. **Edit Promptly:** Correct any discrepancies in auto-closed entries as soon as possible
3. **Backdated Entries:** Add backdated expenses carefully and verify adjustments
4. **Manual Override:** You can always manually close/open registers if needed
5. **Backup:** Regular backups are important as automation modifies data

## Support

For issues or questions, check:
- Server console logs for error messages
- Database integrity: `SELECT * FROM cash_register ORDER BY date DESC LIMIT 10`
- Notification history: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20`
