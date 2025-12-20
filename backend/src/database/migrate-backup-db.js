const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Migration script to update backed-up databases to current schema
 * This adds missing tables: other_income and cash_register
 */

function runMigration(dbPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Migrating database: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('✓ Database opened successfully');
    });

    // Run migrations in sequence
    db.serialize(() => {
      // Check and create other_income table
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='other_income'", (err, row) => {
        if (err) {
          console.error('Error checking other_income table:', err);
          return;
        }

        if (!row) {
          console.log('Creating other_income table...');
          db.run(`
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
            )
          `, (err) => {
            if (err) {
              console.error('Error creating other_income table:', err);
            } else {
              console.log('✓ other_income table created');
              
              // Create indexes
              db.run('CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income(date)', (err) => {
                if (err) console.error('Error creating date index:', err);
                else console.log('✓ Index created on other_income.date');
              });
              
              db.run('CREATE INDEX IF NOT EXISTS idx_other_income_source ON other_income(source)', (err) => {
                if (err) console.error('Error creating source index:', err);
                else console.log('✓ Index created on other_income.source');
              });
            }
          });
        } else {
          console.log('✓ other_income table already exists');
        }
      });

      // Check and create cash_register table
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_register'", (err, row) => {
        if (err) {
          console.error('Error checking cash_register table:', err);
          return;
        }

        if (!row) {
          console.log('Creating cash_register table...');
          db.run(`
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
            )
          `, (err) => {
            if (err) {
              console.error('Error creating cash_register table:', err);
            } else {
              console.log('✓ cash_register table created');
              
              // Create index
              db.run('CREATE INDEX IF NOT EXISTS idx_cash_register_date ON cash_register(date)', (err) => {
                if (err) console.error('Error creating date index:', err);
                else console.log('✓ Index created on cash_register.date');
              });
            }
          });
        } else {
          console.log('✓ cash_register table already exists');
        }
      });

      // Close database after all operations
      setTimeout(() => {
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✓ Database migration completed\n');
            resolve();
          }
        });
      }, 1000); // Wait for async operations to complete
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          Database Migration Tool - Backup to Current Schema    ║
╚════════════════════════════════════════════════════════════════╝

This script migrates backed-up databases to include new tables:
  • other_income (for tracking additional income sources)
  • cash_register (for daily cash management)

Usage:
  node migrate-backup-db.js <path-to-backup.db>
  node migrate-backup-db.js <path-to-backups-folder>

Examples:
  node migrate-backup-db.js ../backups/database-backup-2024-12-19.db
  node migrate-backup-db.js ../backups/

Note: This script is safe to run multiple times. It will only add
missing tables and won't affect existing data.
    `);
    process.exit(0);
  }

  const targetPath = path.resolve(args[0]);

  try {
    const stats = fs.statSync(targetPath);

    if (stats.isFile()) {
      // Single file migration
      if (!targetPath.endsWith('.db')) {
        console.error('❌ Error: File must have .db extension');
        process.exit(1);
      }
      await runMigration(targetPath);
      console.log('✅ Migration completed successfully!');
    } else if (stats.isDirectory()) {
      // Batch migration for all .db files in directory
      const files = fs.readdirSync(targetPath)
        .filter(f => f.endsWith('.db'))
        .map(f => path.join(targetPath, f));

      if (files.length === 0) {
        console.log('No .db files found in directory');
        process.exit(0);
      }

      console.log(`Found ${files.length} database file(s) to migrate\n`);

      for (const file of files) {
        await runMigration(file);
      }

      console.log('✅ All migrations completed successfully!');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('❌ Error: File or directory not found');
    } else {
      console.error('❌ Error:', err.message);
    }
    process.exit(1);
  }
}

main();
