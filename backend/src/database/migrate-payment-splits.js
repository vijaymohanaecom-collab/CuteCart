const { initDatabase, dbExec, dbRun, dbAll } = require('../config/database');

async function migrate() {
  console.log('Starting payment splits migration...');
  
  await initDatabase();

  try {
    // Add new columns to invoices table
    await dbExec(`
      ALTER TABLE invoices ADD COLUMN cash_amount REAL DEFAULT 0;
    `);
    console.log('✓ Added cash_amount column');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('  cash_amount column already exists');
    } else {
      throw err;
    }
  }

  try {
    await dbExec(`
      ALTER TABLE invoices ADD COLUMN upi_amount REAL DEFAULT 0;
    `);
    console.log('✓ Added upi_amount column');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('  upi_amount column already exists');
    } else {
      throw err;
    }
  }

  try {
    await dbExec(`
      ALTER TABLE invoices ADD COLUMN card_amount REAL DEFAULT 0;
    `);
    console.log('✓ Added card_amount column');
  } catch (err) {
    if (err.message.includes('duplicate column')) {
      console.log('  card_amount column already exists');
    } else {
      throw err;
    }
  }

  // Migrate existing invoices to use the new payment split columns
  console.log('\nMigrating existing invoices...');
  const invoices = await dbAll('SELECT id, total, payment_method FROM invoices');
  
  for (const invoice of invoices) {
    const paymentMethod = (invoice.payment_method || 'cash').toLowerCase();
    const total = invoice.total || 0;
    
    // Set the appropriate payment amount based on the payment method
    if (paymentMethod === 'cash') {
      await dbRun('UPDATE invoices SET cash_amount = ?, upi_amount = 0, card_amount = 0 WHERE id = ?', 
        [total, invoice.id]);
    } else if (paymentMethod === 'upi') {
      await dbRun('UPDATE invoices SET cash_amount = 0, upi_amount = ?, card_amount = 0 WHERE id = ?', 
        [total, invoice.id]);
    } else if (paymentMethod === 'card') {
      await dbRun('UPDATE invoices SET cash_amount = 0, upi_amount = 0, card_amount = ? WHERE id = ?', 
        [total, invoice.id]);
    } else {
      // Default to cash for unknown payment methods
      await dbRun('UPDATE invoices SET cash_amount = ?, upi_amount = 0, card_amount = 0 WHERE id = ?', 
        [total, invoice.id]);
    }
  }
  
  console.log(`✓ Migrated ${invoices.length} invoices`);
  console.log('\n✓ Migration complete!');
  console.log('  Invoices now support split payments (Cash + UPI + Card)');
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
