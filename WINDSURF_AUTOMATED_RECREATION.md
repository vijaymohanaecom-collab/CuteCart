# CuteCart POS System - Complete Automated Recreation

This is a comprehensive guide for Windsurf AI to recreate the entire CuteCart POS system automatically.

**Instructions for Windsurf AI:**
- Execute each step in order
- Verify completion before moving to next step
- Run tests after each major section
- Create all files with exact specifications
- Ensure responsive design for desktop and mobile

---

## PHASE 1: PROJECT SETUP

### Step 1.1: Create Project Structure
```bash
mkdir CuteCart
cd CuteCart
mkdir -p backend/src/{config,database,routes}
mkdir -p frontend/src/app/{config,models,services,guards}
mkdir -p frontend/src/app/{login,dashboard,billing,products,invoices,invoice,settings,user-management,forgot-password,reset-password}
mkdir -p frontend/src/environments
mkdir docs
```

### Step 1.2: Initialize Backend
```bash
cd backend
npm init -y
npm install express@^4.18.2 cors@^2.8.5 sqlite3@^5.1.6 bcryptjs@^2.4.3 jsonwebtoken@^9.0.2 dotenv@^16.3.1
npm install --save-dev nodemon@^3.0.1
```

### Step 1.3: Initialize Frontend
```bash
cd ../frontend
ng new . --standalone --routing --style=css --skip-git --skip-install
npm install
npm install chart.js@^4.4.0 html2canvas@^1.4.1
```

**✓ Checkpoint:** Verify node_modules exist in both backend and frontend folders

---

## PHASE 2: BACKEND IMPLEMENTATION

### Step 2.1: Backend Configuration Files

**File: `backend/package.json`** (Update scripts section)
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "init-db": "node src/database/init.js"
  }
}
```

**File: `backend/.env`**
```env
PORT=3000
JWT_SECRET=cutecart-secret-key-change-in-production-2024
```

### Step 2.2: Database Configuration

**File: `backend/src/config/database.js`**
```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.db');
let db;

function initDatabase() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Database initialized');
    }
  });
  return db;
}

function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    getDatabase().exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  initDatabase,
  getDatabase,
  dbRun,
  dbGet,
  dbAll,
  dbExec
};
```

### Step 2.3: Database Initialization

**File: `backend/src/database/init.js`**
```javascript
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
    await dbRun(`INSERT INTO settings (id, store_name, currency, tax_rate, invoice_prefix, invoice_footer, low_stock_threshold) 
                 VALUES (1, 'CuteCart', 'INR', 10, 'INV', 'Thank you for your business!', 10)`);
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
```

### Step 2.4: Main Server

**File: `backend/src/server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Access from network: http://<your-ip>:${PORT}`);
});
```

### Step 2.5: Authentication Routes

**File: `backend/src/routes/auth.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet } = require('../config/database');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2.6: Products Routes

**File: `backend/src/routes/products.js`**
```javascript
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY id');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { id, name, description, price, purchase_price, stock, barcode, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    let productId = id;
    if (!productId) {
      const lastProduct = await dbGet('SELECT id FROM products ORDER BY CAST(id AS INTEGER) DESC LIMIT 1');
      productId = lastProduct ? String(parseInt(lastProduct.id) + 1) : '1';
    }

    // Check for duplicate
    const existing = await dbGet('SELECT id FROM products WHERE id = ?', [productId]);
    if (existing) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    await dbRun(
      'INSERT INTO products (id, name, description, price, purchase_price, stock, barcode, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, name, description || '', price, purchase_price || 0, stock || 0, barcode || null, category || '']
    );

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, purchase_price, stock, barcode, category } = req.body;

    await dbRun(
      'UPDATE products SET name = ?, description = ?, price = ?, purchase_price = ?, stock = ?, barcode = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, price, purchase_price, stock, barcode, category, req.params.id]
    );

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    // Check if product is used in invoices
    const used = await dbGet('SELECT id FROM invoice_items WHERE product_id = ? LIMIT 1', [req.params.id]);
    if (used) {
      return res.status(400).json({ error: 'Cannot delete product that has been sold' });
    }

    await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2.7: Invoices Routes

**File: `backend/src/routes/invoices.js`**
```javascript
const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../config/database');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await dbAll('SELECT * FROM invoices ORDER BY created_at DESC');
    
    for (const invoice of invoices) {
      const items = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
      invoice.items = items;
    }
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await dbGet('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const items = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    invoice.items = items;
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, items, subtotal, tax_rate, tax_amount, discount, total, payment_method, notes, created_at } = req.body;
    
    // Generate invoice number
    const settings = await dbGet('SELECT invoice_prefix FROM settings LIMIT 1');
    const prefix = settings?.invoice_prefix || 'INV';
    const lastInvoice = await dbGet('SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1');
    let invoiceNumber;
    
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace(prefix, ''));
      invoiceNumber = `${prefix}${String(lastNumber + 1).padStart(5, '0')}`;
    } else {
      invoiceNumber = `${prefix}00001`;
    }
    
    // Use provided timestamp or current time
    const timestamp = created_at || new Date().toISOString();
    
    // Insert invoice
    const invoiceResult = await dbRun(
      'INSERT INTO invoices (invoice_number, customer_name, customer_phone, subtotal, tax_rate, tax_amount, discount, total, payment_method, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceNumber, customer_name || '', customer_phone || '', subtotal, tax_rate, tax_amount, discount || 0, total, payment_method, notes || '', timestamp]
    );
    
    const invoiceId = invoiceResult.id;
    
    // Insert invoice items and update stock
    for (const item of items) {
      // Get product purchase price
      const product = await dbGet('SELECT purchase_price FROM products WHERE id = ?', [item.product_id]);
      const purchasePrice = product?.purchase_price || 0;
      
      await dbRun(
        'INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total_price, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [invoiceId, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price, purchasePrice]
      );
      
      // Update product stock
      await dbRun(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Get complete invoice
    const invoice = await dbGet('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    const invoiceItems = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    invoice.items = invoiceItems;
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);
    
    const todayStats = await dbGet(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE DATE(created_at) = ?',
      [today]
    );
    
    const monthStats = await dbGet(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices WHERE strftime("%Y-%m", created_at) = ?',
      [thisMonth]
    );
    
    const totalStats = await dbGet(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM invoices'
    );
    
    res.json({
      today: todayStats,
      month: monthStats,
      total: totalStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2.8: Users Routes

**File: `backend/src/routes/users.js`**
```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll } = require('../config/database');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await dbAll('SELECT id, username, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Check if username exists
    const existing = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await dbRun(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    const user = await dbGet('SELECT id, username, role, created_at FROM users WHERE username = ?', [username]);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await dbRun(
        'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
        [username, hashedPassword, role, req.params.id]
      );
    } else {
      await dbRun(
        'UPDATE users SET username = ?, role = ? WHERE id = ?',
        [username, role, req.params.id]
      );
    }

    const user = await dbGet('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    // Check if this is the last admin
    const adminCount = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const user = await dbGet('SELECT role FROM users WHERE id = ?', [req.params.id]);
    
    if (user.role === 'admin' && adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 2.9: Settings Routes

**File: `backend/src/routes/settings.js`**
```javascript
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { dbRun, dbGet } = require('../config/database');

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await dbGet('SELECT * FROM settings LIMIT 1');
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const { store_name, store_address, store_phone, store_email, store_website, tax_rate, currency, invoice_prefix, invoice_footer, enable_barcode, low_stock_threshold } = req.body;

    await dbRun(
      `UPDATE settings SET 
        store_name = ?, store_address = ?, store_phone = ?, store_email = ?, store_website = ?,
        tax_rate = ?, currency = ?, invoice_prefix = ?, invoice_footer = ?, 
        enable_barcode = ?, low_stock_threshold = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
      [store_name, store_address, store_phone, store_email, store_website, tax_rate, currency, invoice_prefix, invoice_footer, enable_barcode, low_stock_threshold]
    );

    const settings = await dbGet('SELECT * FROM settings WHERE id = 1');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup database
router.get('/backup', (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../../database.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `cutecart-backup-${timestamp}.db`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**✓ Checkpoint:** Test backend
```bash
cd backend
npm run init-db
npm start
# Should see: "Database initialized" and "Server running on http://0.0.0.0:3000"
# Test: Open browser to http://localhost:3000/api/health
# Should see: {"status":"ok","message":"Server is running"}
```

---

## PHASE 3: FRONTEND IMPLEMENTATION

### Step 3.1: Environment Configuration

**File: `frontend/src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**File: `frontend/src/environments/environment.network.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.100:3000/api'
};
```

**File: `frontend/src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api'
};
```

### Step 3.2: Timezone Configuration

**File: `frontend/src/app/config/timezone.config.ts`**
```typescript
export const TIMEZONE_CONFIG = {
  timezone: 'Asia/Kolkata',
  locale: 'en-IN'
};
```

### Step 3.3: Data Models

**File: `frontend/src/app/models/product.model.ts`**
```typescript
export interface Product {
  id?: string | number;
  name: string;
  description?: string;
  price: number;
  purchase_price?: number;
  stock?: number;
  barcode?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}
```

**File: `frontend/src/app/models/invoice.model.ts`**
```typescript
export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id?: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_price?: number;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount?: number;
  total: number;
  payment_method?: string;
  notes?: string;
  created_at?: string;
}
```

**File: `frontend/src/app/models/user.model.ts`**
```typescript
export interface User {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'sales';
  created_at?: string;
}
```

**File: `frontend/src/app/models/settings.model.ts`**
```typescript
export interface Settings {
  id?: number;
  store_name: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_website?: string;
  tax_rate: number;
  currency: string;
  invoice_prefix: string;
  invoice_footer?: string;
  enable_barcode?: number;
  low_stock_threshold?: number;
  updated_at?: string;
}
```

### Step 3.4: Services

**File: `frontend/src/app/services/api.service.ts`**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { Invoice } from '../models/invoice.model';
import { User } from '../models/user.model';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProduct(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string | number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  // Invoices
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice);
  }

  getInvoiceStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/stats/summary`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // Settings
  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.apiUrl}/settings`, settings);
  }

  backupDatabase(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/settings/backup`, { responseType: 'blob' });
  }
}
```

**File: `frontend/src/app/services/auth.service.ts`**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const user = this.getCurrentUser();
    if (user) {
      this.currentUserSubject.next(user);
      this.resetInactivityTimer();
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.resetInactivityTimer();
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'manager';
  }

  canViewProfit(): boolean {
    return this.isManager();
  }

  resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      this.autoLogout();
    }, this.INACTIVITY_TIMEOUT);
  }

  private autoLogout(): void {
    alert('Session expired due to inactivity. Please login again.');
    this.logout();
  }
}
```

### Step 3.5: Guards

**File: `frontend/src/app/guards/auth.guard.ts`**
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    authService.resetInactivityTimer();
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

**File: `frontend/src/app/guards/role.guard.ts`**
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  const user = authService.getCurrentUser();

  if (requiredRoles && requiredRoles.includes(user.role)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
```

### Step 3.6: Routes Configuration

**File: `frontend/src/app/app.routes.ts`**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'billing', 
    loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'products', 
    loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'invoices', 
    loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'users', 
    loadComponent: () => import('./user-management/user-management').then(m => m.UserManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPasswordComponent)
  }
];
```

**✓ Checkpoint:** Verify all configuration files are created

---

## PHASE 4: GLOBAL STYLES (CRITICAL FOR APPEARANCE)

**File: `frontend/src/styles.css`**

[Due to length limits, I'll continue in the next message with the complete styles and remaining components]

Would you like me to continue with:
1. Complete global styles (CSS)
2. All component implementations
3. Angular configuration updates
4. Testing procedures

Type "continue" and I'll provide the rest!
