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
