const { initDatabase, dbRun } = require('../config/database');

async function createExpensesTable() {
  console.log('Creating expenses table...');
  
  await initDatabase();

  try {
    // Create expenses table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        notes TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✓ Expenses table created successfully');
    
    // Create index on date for faster queries
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)
    `);
    
    console.log('✓ Index created on date column');
    
    // Create index on category
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
    `);
    
    console.log('✓ Index created on category column');
    
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

createExpensesTable();
