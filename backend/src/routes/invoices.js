const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../config/database');

// Get unique customers
router.get('/customers/list', async (req, res) => {
  try {
    const customers = await dbAll(`
      SELECT DISTINCT customer_name, customer_phone 
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != '' 
      ORDER BY customer_name
    `);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// Update invoice (customer info and payment method only)
router.put('/:id', async (req, res) => {
  try {
    const { customer_name, customer_phone, payment_method } = req.body;
    
    await dbRun(
      'UPDATE invoices SET customer_name = ?, customer_phone = ?, payment_method = ? WHERE id = ?',
      [customer_name || '', customer_phone || '', payment_method || 'cash', req.params.id]
    );
    
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

// Delete invoice
router.delete('/:id', async (req, res) => {
  console.log(`DELETE /api/invoices/${req.params.id} called`);
  try {
    console.log('Getting invoice items to restore stock...');
    // First, get all invoice items to restore stock
    const invoiceItems = await dbAll('SELECT product_id, quantity FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    console.log(`Found ${invoiceItems.length} invoice items to process`);

    // Restore stock for each product
    for (const item of invoiceItems) {
      if (item.product_id) {
        console.log(`Restoring ${item.quantity} units to product ${item.product_id}`);
        await dbRun(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    console.log('Deleting invoice items...');
    // Delete invoice items first (due to foreign key constraint)
    await dbRun('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);

    console.log('Deleting invoice...');
    // Delete the invoice
    const result = await dbRun('DELETE FROM invoices WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      console.log('Invoice not found');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log('Invoice deleted successfully');
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
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
