// Quick test script to verify customers route
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'pos.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing customers query...\n');

// Test 1: Check if there are any invoices with customer data
db.all(
  `SELECT COUNT(*) as count FROM invoices WHERE customer_name IS NOT NULL AND customer_name != ''`,
  [],
  (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('Total invoices with customer names:', rows[0].count);
  }
);

// Test 2: Run the actual customers query
db.all(
  `SELECT 
    customer_name,
    customer_phone,
    COUNT(*) as total_purchases,
    COALESCE(SUM(total), 0) as total_spent,
    COALESCE(AVG(total), 0) as avg_purchase_value,
    MIN(created_at) as first_purchase_date,
    MAX(created_at) as last_purchase_date,
    CASE 
      WHEN julianday('now') - julianday(MAX(created_at)) <= 7 THEN 'active'
      ELSE 'inactive'
    END as status
  FROM invoices 
  WHERE customer_name IS NOT NULL AND customer_name != ''
  GROUP BY customer_name, customer_phone
  ORDER BY last_purchase_date DESC
  LIMIT 5`,
  [],
  (err, rows) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }
    console.log('\nSample customers:');
    console.log(JSON.stringify(rows, null, 2));
    db.close();
  }
);
