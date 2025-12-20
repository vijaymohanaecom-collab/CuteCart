const { initDatabase, dbRun } = require('../config/database');

async function createCashRegisterTable() {
  console.log('Creating cash_register table...');
  
  await initDatabase();

  try {
    await dbRun(`
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
    `);
    
    console.log('✓ Cash register table created successfully');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_cash_register_date ON cash_register(date)
    `);
    
    console.log('✓ Index created on date column');
    
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

createCashRegisterTable();
