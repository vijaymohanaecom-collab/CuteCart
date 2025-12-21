const { initDatabase, dbRun } = require('../config/database');

async function createStockBatchesTable() {
  console.log('Creating stock_batches table...');
  
  await initDatabase();

  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS stock_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        purchase_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        notes TEXT,
        added_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✓ Stock batches table created successfully');
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id)
    `);
    
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_stock_batches_created_at ON stock_batches(created_at DESC)
    `);
    
    console.log('✓ Indexes created on stock_batches table');
    
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

createStockBatchesTable();
