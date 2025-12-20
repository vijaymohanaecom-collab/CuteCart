const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all other income entries
router.get('/', async (req, res) => {
  try {
    const income = await dbAll('SELECT * FROM other_income ORDER BY date DESC, created_at DESC');
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get income by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const income = await dbAll(
      'SELECT * FROM other_income WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get income statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM other_income';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    const income = await dbAll(query, params);
    
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalCash = income.reduce((sum, item) => sum + item.cash_amount, 0);
    const totalBank = income.reduce((sum, item) => sum + item.bank_amount, 0);
    
    // Group by source
    const bySource = {};
    income.forEach(item => {
      if (!bySource[item.source]) {
        bySource[item.source] = { source: item.source, total: 0, count: 0 };
      }
      bySource[item.source].total += item.amount;
      bySource[item.source].count += 1;
    });
    
    // Group by payment mode
    const byMode = {};
    income.forEach(item => {
      if (!byMode[item.payment_mode]) {
        byMode[item.payment_mode] = { mode: item.payment_mode, total: 0, count: 0 };
      }
      byMode[item.payment_mode].total += item.amount;
      byMode[item.payment_mode].count += 1;
    });
    
    res.json({
      totalIncome,
      totalCash,
      totalBank,
      incomeCount: income.length,
      bySource: Object.values(bySource).sort((a, b) => b.total - a.total),
      byMode: Object.values(byMode).sort((a, b) => b.total - a.total)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get income by ID
router.get('/:id', async (req, res) => {
  try {
    const income = await dbGet('SELECT * FROM other_income WHERE id = ?', [req.params.id]);
    
    if (!income) {
      return res.status(404).json({ error: 'Income entry not found' });
    }
    
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new income entry
router.post('/', async (req, res) => {
  try {
    const { date, source, amount, payment_mode, cash_amount, bank_amount, notes, created_by } = req.body;
    
    // Validation
    if (!date || !source || !amount || !payment_mode) {
      return res.status(400).json({ error: 'Date, source, amount, and payment mode are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Calculate cash and bank amounts based on payment mode
    let cashAmt = 0;
    let bankAmt = 0;
    
    if (payment_mode === 'cash') {
      cashAmt = amount;
    } else if (payment_mode === 'bank') {
      bankAmt = amount;
    } else if (payment_mode === 'split') {
      cashAmt = cash_amount || 0;
      bankAmt = bank_amount || 0;
      
      if (Math.abs((cashAmt + bankAmt) - amount) > 0.01) {
        return res.status(400).json({ error: 'Cash and bank amounts must equal total amount' });
      }
    }
    
    const result = await dbRun(
      `INSERT INTO other_income (date, source, amount, cash_amount, bank_amount, payment_mode, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, source, amount, cashAmt, bankAmt, payment_mode, notes || '', created_by || '']
    );
    
    const income = await dbGet('SELECT * FROM other_income WHERE id = ?', [result.lastID]);
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update income entry
router.put('/:id', async (req, res) => {
  try {
    const { date, source, amount, payment_mode, cash_amount, bank_amount, notes } = req.body;
    
    // Check if income exists
    const existing = await dbGet('SELECT * FROM other_income WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Income entry not found' });
    }
    
    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Calculate cash and bank amounts
    let cashAmt = existing.cash_amount;
    let bankAmt = existing.bank_amount;
    const finalAmount = amount || existing.amount;
    const finalMode = payment_mode || existing.payment_mode;
    
    if (payment_mode) {
      if (finalMode === 'cash') {
        cashAmt = finalAmount;
        bankAmt = 0;
      } else if (finalMode === 'bank') {
        cashAmt = 0;
        bankAmt = finalAmount;
      } else if (finalMode === 'split') {
        cashAmt = cash_amount !== undefined ? cash_amount : existing.cash_amount;
        bankAmt = bank_amount !== undefined ? bank_amount : existing.bank_amount;
        
        if (Math.abs((cashAmt + bankAmt) - finalAmount) > 0.01) {
          return res.status(400).json({ error: 'Cash and bank amounts must equal total amount' });
        }
      }
    }
    
    await dbRun(
      `UPDATE other_income SET 
        date = ?, source = ?, amount = ?, cash_amount = ?, bank_amount = ?,
        payment_mode = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        date || existing.date,
        source || existing.source,
        finalAmount,
        cashAmt,
        bankAmt,
        finalMode,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );
    
    const income = await dbGet('SELECT * FROM other_income WHERE id = ?', [req.params.id]);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete income entry
router.delete('/:id', async (req, res) => {
  try {
    const income = await dbGet('SELECT * FROM other_income WHERE id = ?', [req.params.id]);
    
    if (!income) {
      return res.status(404).json({ error: 'Income entry not found' });
    }
    
    await dbRun('DELETE FROM other_income WHERE id = ?', [req.params.id]);
    res.json({ message: 'Income entry deleted successfully', income });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
