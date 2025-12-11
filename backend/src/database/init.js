const bcrypt = require('bcryptjs');
const { initDatabase, dbExec, dbRun } = require('../config/database');

async function initialize() {
  console.log('Initializing database...');
  
  await initDatabase();

  // Create tables
  await dbExec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      barcode TEXT UNIQUE,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL NOT NULL,
      tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT,
      cash_amount REAL DEFAULT 0,
      upi_amount REAL DEFAULT 0,
      card_amount REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      store_name TEXT NOT NULL,
      store_address TEXT,
      store_phone TEXT,
      store_email TEXT,
      store_website TEXT,
      tax_rate REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      invoice_prefix TEXT DEFAULT 'INV',
      invoice_footer TEXT,
      enable_barcode INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      discount_presets TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables created successfully');

  // Insert default users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);

  try {
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', adminPassword, 'admin']);
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Manager', managerPassword, 'manager']);
    await dbRun('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Sales', salesPassword, 'sales']);
    console.log('Default users created');
  } catch (err) {
    console.log('Users already exist');
  }

  // Insert default settings
  try {
    await dbRun(`INSERT INTO settings (id, store_name, currency, tax_rate, invoice_prefix, invoice_footer, low_stock_threshold, discount_presets) 
                 VALUES (1, 'CuteCart', 'INR', 10, 'INV', 'Thank you for your business!', 10, ?)`
                 , [JSON.stringify([5, 10, 15, 20])]);
    console.log('Default settings created');
  } catch (err) {
    console.log('Settings already exist');
  }

  console.log('✓ Database initialization complete!');
  console.log('✓ Default credentials:');
  console.log('  - Admin: admin / admin123');
  console.log('  - Manager: Manager / manager123');
  console.log('  - Sales: Sales / sales123');
  
  process.exit(0);
}

initialize().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
