const { initDatabase, dbRun } = require('../config/database');

async function updateCashRegisterSchema() {
  console.log('Updating cash_register table schema...');
  
  await initDatabase();

  try {
    await dbRun(`
      ALTER TABLE cash_register ADD COLUMN status TEXT DEFAULT 'open'
    `);
    console.log('✓ Added status column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ Status column already exists');
    } else {
      throw err;
    }
  }

  try {
    await dbRun(`
      ALTER TABLE cash_register ADD COLUMN is_auto_closed INTEGER DEFAULT 0
    `);
    console.log('✓ Added is_auto_closed column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ is_auto_closed column already exists');
    } else {
      throw err;
    }
  }

  try {
    await dbRun(`
      ALTER TABLE cash_register ADD COLUMN is_auto_opened INTEGER DEFAULT 0
    `);
    console.log('✓ Added is_auto_opened column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ is_auto_opened column already exists');
    } else {
      throw err;
    }
  }

  console.log('✓ Schema update complete!');
  process.exit(0);
}

updateCashRegisterSchema().catch(err => {
  console.error('Error during schema update:', err);
  process.exit(1);
});
