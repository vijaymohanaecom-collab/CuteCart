const { initDatabase, dbRun } = require('../config/database');

async function createOtherIncomeTable() {
  console.log('Creating other_income table...');
  
  await initDatabase();

  try {
    await dbRun(`
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
    `);
    
    console.log('✓ Other income table created successfully');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income(date)
    `);
    
    console.log('✓ Index created on date column');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_other_income_source ON other_income(source)
    `);
    
    console.log('✓ Index created on source column');
    
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

createOtherIncomeTable();
