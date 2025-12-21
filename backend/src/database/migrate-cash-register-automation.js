const { initDatabase, dbRun } = require('../config/database');

async function migrateCashRegisterAutomation() {
  console.log('Starting cash register automation migration...');
  
  await initDatabase();

  try {
    console.log('\n1. Updating cash_register table schema...');
    
    try {
      await dbRun(`ALTER TABLE cash_register ADD COLUMN status TEXT DEFAULT 'open'`);
      console.log('✓ Added status column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ Status column already exists');
      } else {
        throw err;
      }
    }

    try {
      await dbRun(`ALTER TABLE cash_register ADD COLUMN is_auto_closed INTEGER DEFAULT 0`);
      console.log('✓ Added is_auto_closed column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ is_auto_closed column already exists');
      } else {
        throw err;
      }
    }

    try {
      await dbRun(`ALTER TABLE cash_register ADD COLUMN is_auto_opened INTEGER DEFAULT 0`);
      console.log('✓ Added is_auto_opened column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ is_auto_opened column already exists');
      } else {
        throw err;
      }
    }

    console.log('\n2. Creating notifications table...');
    
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_date TEXT,
        related_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Notifications table created');

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `);
    console.log('✓ Index created on created_at column');

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);
    console.log('✓ Index created on is_read column');

    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the backend server to activate the automation');
    console.log('2. The system will automatically:');
    console.log('   - Close yesterday\'s register at midnight if not closed');
    console.log('   - Open today\'s register with yesterday\'s closing balance');
    console.log('   - Adjust cash registers when backdated expenses are added/modified');
    console.log('   - Send notifications for all automatic actions');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

migrateCashRegisterAutomation();
