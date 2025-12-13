const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usage: node migrate-backup-db.js <path-to-backup-db-file>
// Example: node migrate-backup-db.js ./backups/cutecart-backup-2025-12-13.db

const backupDbPath = process.argv[2];

if (!backupDbPath) {
  console.error('Error: Please provide the path to your backup database file');
  console.log('Usage: node migrate-backup-db.js <path-to-backup-db-file>');
  console.log('Example: node migrate-backup-db.js ./backups/cutecart-backup-2025-12-13.db');
  process.exit(1);
}

const db = new sqlite3.Database(backupDbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database: ${backupDbPath}`);
});

async function migrateDatabase() {
  console.log('\nStarting migration...\n');
  
  return new Promise((resolve, reject) => {
    // Add discount_presets column
    db.run("ALTER TABLE settings ADD COLUMN discount_presets TEXT", (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log('✓ discount_presets column already exists');
          
          // Set default value if it's null
          db.run(
            "UPDATE settings SET discount_presets = ? WHERE discount_presets IS NULL",
            [JSON.stringify([5, 10, 15, 20])],
            (updateErr) => {
              if (updateErr) {
                reject(updateErr);
              } else {
                console.log('✓ Default discount presets set for null values');
                resolve();
              }
            }
          );
        } else {
          reject(err);
        }
      } else {
        console.log('✓ discount_presets column added successfully');
        
        // Set default value
        db.run(
          "UPDATE settings SET discount_presets = ? WHERE id = 1",
          [JSON.stringify([5, 10, 15, 20])],
          (updateErr) => {
            if (updateErr) {
              reject(updateErr);
            } else {
              console.log('✓ Default discount presets set: [5, 10, 15, 20]');
              resolve();
            }
          }
        );
      }
    });
  });
}

migrateDatabase()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    console.log(`Your backup database has been upgraded: ${backupDbPath}`);
    db.close();
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err.message);
    db.close();
    process.exit(1);
  });
