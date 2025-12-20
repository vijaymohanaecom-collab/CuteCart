const { initDatabase, dbExec, dbRun, dbGet } = require('../config/database');

async function migrate() {
  console.log('Starting migration to add payment columns...');
  
  await initDatabase();

  try {
    // Check if columns already exist
    const tableInfo = await dbGet("PRAGMA table_info(invoices)");
    console.log('Checking existing columns...');
    
    // Add cash_amount column if it doesn't exist
    try {
      await dbExec('ALTER TABLE invoices ADD COLUMN cash_amount REAL DEFAULT 0');
      console.log('✓ Added cash_amount column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('- cash_amount column already exists');
      } else {
        throw err;
      }
    }

    // Add upi_amount column if it doesn't exist
    try {
      await dbExec('ALTER TABLE invoices ADD COLUMN upi_amount REAL DEFAULT 0');
      console.log('✓ Added upi_amount column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('- upi_amount column already exists');
      } else {
        throw err;
      }
    }

    // Add card_amount column if it doesn't exist
    try {
      await dbExec('ALTER TABLE invoices ADD COLUMN card_amount REAL DEFAULT 0');
      console.log('✓ Added card_amount column');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('- card_amount column already exists');
      } else {
        throw err;
      }
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
