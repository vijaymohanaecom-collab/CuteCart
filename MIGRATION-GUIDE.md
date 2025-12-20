# Database Migration Guide

## Migrating Backed-Up Databases to Current Schema

If you have backed-up database files from before the **Other Income** and **Cash Register** features were added, you need to migrate them to include the new tables.

---

## Quick Start

### Migrate a Single Backup File

```bash
node backend/src/database/migrate-backup-db.js path/to/your/backup.db
```

### Migrate All Backups in a Folder

```bash
node backend/src/database/migrate-backup-db.js backend/backups/
```

---

## What Gets Added

The migration script adds these new tables if they don't exist:

### 1. **other_income** Table
Tracks additional income sources (Amazon, Stall, etc.)
- Fields: date, source, amount, cash_amount, bank_amount, payment_mode, notes
- Indexes: date, source

### 2. **cash_register** Table
Manages daily cash register operations
- Fields: date, opening_cash, closing_cash, expected_closing_cash, difference, notes
- Indexes: date

---

## Step-by-Step Migration Process

### Option 1: Migrate Before Restoring

**Best practice - keeps your backups updated**

1. Locate your backup files:
   ```bash
   cd backend/backups
   ```

2. Run migration on the backup folder:
   ```bash
   node ../src/database/migrate-backup-db.js .
   ```

3. Restore the migrated backup through the app UI (Backup page)

### Option 2: Migrate After Restoring

**If you've already restored an old backup**

1. Stop the application

2. Migrate the current database:
   ```bash
   node backend/src/database/migrate-backup-db.js backend/database.db
   ```

3. Restart the application

---

## Examples

### Migrate a specific backup file
```bash
node backend/src/database/migrate-backup-db.js backend/backups/database-backup-2024-12-19.db
```

### Migrate all backups in the backups folder
```bash
node backend/src/database/migrate-backup-db.js backend/backups/
```

### Migrate the development database
```bash
node backend/src/database/migrate-backup-db.js backend/database.dev.db
```

### Migrate the production database
```bash
node backend/src/database/migrate-backup-db.js backend/database.db
```

---

## Safety Notes

✅ **Safe to run multiple times** - The script checks if tables exist before creating them

✅ **No data loss** - Only adds new tables, doesn't modify existing data

✅ **Backup recommended** - Always keep a copy of your original backup before migration

⚠️ **Stop the app first** - If migrating the active database, stop the application to avoid conflicts

---

## Verification

After migration, verify the tables were added:

```bash
sqlite3 backend/database.db ".tables"
```

You should see:
- `other_income`
- `cash_register`
- (plus all your existing tables)

---

## Troubleshooting

### "File or directory not found"
- Check the path is correct
- Use absolute path or correct relative path from project root

### "Database is locked"
- Stop the application before migrating the active database
- Close any SQLite browser tools that might have the database open

### "Permission denied"
- Ensure you have write permissions to the database file
- On Windows, run terminal as administrator if needed

---

## Alternative: Manual Migration via SQL

If you prefer to run SQL directly:

```sql
-- Add other_income table
CREATE TABLE IF NOT EXISTS other_income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  amount REAL NOT NULL,
  cash_amount REAL DEFAULT 0,
  bank_amount REAL DEFAULT 0,
  payment_mode TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income(date);
CREATE INDEX IF NOT EXISTS idx_other_income_source ON other_income(source);

-- Add cash_register table
CREATE TABLE IF NOT EXISTS cash_register (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  opening_cash REAL NOT NULL,
  closing_cash REAL,
  expected_closing_cash REAL,
  difference REAL,
  notes TEXT,
  created_by TEXT,
  closed_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_cash_register_date ON cash_register(date);
```

Run with:
```bash
sqlite3 backend/database.db < migration.sql
```

---

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Ensure the database file path is correct
3. Verify you have the necessary permissions
4. Make sure the application is stopped if migrating the active database
