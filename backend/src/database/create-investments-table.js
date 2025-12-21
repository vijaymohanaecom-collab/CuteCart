const { initDatabase, dbRun } = require('../config/database');

async function createInvestmentsTable() {
  console.log('Creating investments table...');
  
  await initDatabase();

  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        person TEXT NOT NULL,
        amount REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Investments table created successfully');

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date)
    `);
    console.log('✓ Date index created');

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_investments_person ON investments(person)
    `);
    console.log('✓ Person index created');

    console.log('\n✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating investments table:', error.message);
    process.exit(1);
  }
}

