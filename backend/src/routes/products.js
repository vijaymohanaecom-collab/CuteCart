const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../config/database');
const stockService = require('../services/stock.service');

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

    // Check for duplicate ID
    const existing = await dbGet('SELECT id FROM products WHERE id = ?', [productId]);
    if (existing) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    // Check for duplicate barcode (if barcode is provided)
    if (barcode && barcode.trim()) {
      const existingBarcode = await dbGet('SELECT id, name FROM products WHERE barcode = ?', [barcode.trim()]);
      if (existingBarcode) {
        return res.status(400).json({ 
          error: `Barcode already exists for product: ${existingBarcode.name} (ID: ${existingBarcode.id})` 
        });
      }
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

    // Check for duplicate barcode (if barcode is provided and changed)
    if (barcode && barcode.trim()) {
      const existingBarcode = await dbGet(
        'SELECT id, name FROM products WHERE barcode = ? AND id != ?', 
        [barcode.trim(), req.params.id]
      );
      if (existingBarcode) {
        return res.status(400).json({ 
          error: `Barcode already exists for product: ${existingBarcode.name} (ID: ${existingBarcode.id})` 
        });
      }
    }

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
    await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export products to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY name');
    
    // Create CSV header
    const csvHeader = 'ID,Name,Description,Price,Purchase Price,Stock,Category,Barcode\n';
    
    // Create CSV rows
    const csvRows = products.map(p => {
      return `${p.id},"${(p.name || '').replace(/"/g, '""')}","${(p.description || '').replace(/"/g, '""')}",${p.price || 0},${p.purchase_price || 0},${p.stock || 0},"${(p.category || '').replace(/"/g, '""')}","${(p.barcode || '').replace(/"/g, '""')}"`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import products from CSV
router.post('/import/csv', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }
    
    // Parse CSV data
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or invalid' });
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let errors = [];
    
    for (let i = 0; i < dataLines.length; i++) {
      try {
        // Parse CSV line (handle quoted fields with proper escaping)
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const fields = parseCSVLine(dataLines[i]);
        
        if (fields.length < 4) {
          errors.push(`Line ${i + 2}: Invalid format - expected at least 4 columns`);
          continue;
        }
        
        const [id, name, description, price, purchasePrice, stock, category, barcode] = fields;
        
        if (!name || !price) {
          errors.push(`Line ${i + 2}: Name and price are required`);
          continue;
        }
        
        // Check if product exists (by ID, barcode, or name)
        let existing = null;
        
        if (id && id.trim()) {
          existing = await dbGet('SELECT id FROM products WHERE id = ?', [id.trim()]);
        }
        
        if (!existing && barcode && barcode.trim()) {
          existing = await dbGet('SELECT id FROM products WHERE barcode = ?', [barcode.trim()]);
        }
        
        if (!existing && name && name.trim()) {
          existing = await dbGet('SELECT id FROM products WHERE name = ?', [name.trim()]);
        }
        
        const productData = {
          name: name.trim(),
          description: description ? description.trim() : '',
          price: parseFloat(price) || 0,
          purchase_price: parseFloat(purchasePrice) || 0,
          stock: parseInt(stock) || 0,
          category: category ? category.trim() : '',
          barcode: barcode ? barcode.trim() : null
        };
        
        if (existing) {
          // Update existing product
          await dbRun(
            'UPDATE products SET name = ?, description = ?, price = ?, purchase_price = ?, stock = ?, category = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [productData.name, productData.description, productData.price, productData.purchase_price, productData.stock, productData.category, productData.barcode, existing.id]
          );
        } else {
          // Insert new product with ID if provided
          if (id && id.trim()) {
            await dbRun(
              'INSERT INTO products (id, name, description, price, purchase_price, stock, category, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [id.trim(), productData.name, productData.description, productData.price, productData.purchase_price, productData.stock, productData.category, productData.barcode]
            );
          } else {
            // Auto-generate ID
            const lastProduct = await dbGet('SELECT id FROM products ORDER BY CAST(id AS INTEGER) DESC LIMIT 1');
            const newId = lastProduct ? String(parseInt(lastProduct.id) + 1) : '1';
            await dbRun(
              'INSERT INTO products (id, name, description, price, purchase_price, stock, category, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [newId, productData.name, productData.description, productData.price, productData.purchase_price, productData.stock, productData.category, productData.barcode]
            );
          }
        }
        
        imported++;
      } catch (err) {
        errors.push(`Line ${i + 2}: ${err.message}`);
      }
    }
    
    res.json({
      success: true,
      imported,
      total: dataLines.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add stock to product
router.post('/:id/add-stock', async (req, res) => {
  try {
    const { quantity, purchase_price, sale_price, notes, added_by } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (purchase_price === undefined || purchase_price < 0) {
      return res.status(400).json({ error: 'Purchase price is required and must be non-negative' });
    }

    if (sale_price === undefined || sale_price < 0) {
      return res.status(400).json({ error: 'Sale price is required and must be non-negative' });
    }

    const result = await stockService.addStock(
      req.params.id,
      parseInt(quantity),
      parseFloat(purchase_price),
      parseFloat(sale_price),
      notes || '',
      added_by || ''
    );

    res.json({
      success: true,
      message: 'Stock added successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all stock history (must come before /:id/stock-history to avoid route conflicts)
router.get('/stock-history/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const batches = await stockService.getAllStockHistory(limit);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock history for a product
router.get('/:id/stock-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const batches = await stockService.getStockHistory(req.params.id, limit);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock summary for a product
router.get('/:id/stock-summary', async (req, res) => {
  try {
    const summary = await stockService.getProductStockSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
