const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');
const cashRegisterAutomation = require('../services/cash-register-automation.service');

// Get all cash register entries
router.get('/', async (req, res) => {
  try {
    const entries = await dbAll('SELECT * FROM cash_register ORDER BY date DESC');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cash register entry by date
router.get('/date/:date', async (req, res) => {
  try {
    const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [req.params.date]);
    
    if (!entry) {
      return res.status(404).json({ error: 'Cash register entry not found for this date' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's cash register with calculated closing cash
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing entry
    let entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [today]);
    
    // Calculate cash transactions for today
    const cashSales = await dbGet(
      `SELECT COALESCE(SUM(cash_amount), 0) as total 
       FROM invoices 
       WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
      [today]
    );
    
    const cashExpenses = await dbGet(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM expenses 
       WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
      [today]
    );
    
    const expectedClosingCash = entry 
      ? entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0)
      : 0;
    
    res.json({
      entry: entry || null,
      cashSales: cashSales?.total || 0,
      cashExpenses: cashExpenses?.total || 0,
      expectedClosingCash,
      hasEntry: !!entry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cash register summary for date range
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM cash_register';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    query += ' ORDER BY date DESC';
    
    const entries = await dbAll(query, params);
    
    const totalOpening = entries.reduce((sum, e) => sum + e.opening_cash, 0);
    const totalClosing = entries.reduce((sum, e) => sum + (e.closing_cash || 0), 0);
    const totalDifference = entries.reduce((sum, e) => sum + (e.difference || 0), 0);
    
    res.json({
      entries,
      summary: {
        totalOpening,
        totalClosing,
        totalDifference,
        entryCount: entries.length,
        closedCount: entries.filter(e => e.closing_cash !== null).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Open cash register (set opening cash)
router.post('/open', async (req, res) => {
  try {
    const { date, opening_cash, notes, created_by } = req.body;
    
    if (!date || opening_cash === undefined) {
      return res.status(400).json({ error: 'Date and opening cash are required' });
    }
    
    if (opening_cash < 0) {
      return res.status(400).json({ error: 'Opening cash cannot be negative' });
    }
    
    // Check if entry already exists
    const existing = await dbGet('SELECT * FROM cash_register WHERE date = ?', [date]);
    if (existing) {
      return res.status(400).json({ error: 'Cash register already opened for this date' });
    }
    
    const result = await dbRun(
      `INSERT INTO cash_register (date, opening_cash, notes, created_by) 
       VALUES (?, ?, ?, ?)`,
      [date, opening_cash, notes || '', created_by || '']
    );
    
    const entry = await dbGet('SELECT * FROM cash_register WHERE id = ?', [result.lastID]);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close cash register (set closing cash)
router.post('/close', async (req, res) => {
  try {
    const { date, closing_cash, notes, closed_by } = req.body;
    
    if (!date || closing_cash === undefined) {
      return res.status(400).json({ error: 'Date and closing cash are required' });
    }
    
    if (closing_cash < 0) {
      return res.status(400).json({ error: 'Closing cash cannot be negative' });
    }
    
    // Get existing entry
    const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [date]);
    if (!entry) {
      return res.status(404).json({ error: 'Cash register not opened for this date' });
    }
    
    if (entry.closing_cash !== null) {
      return res.status(400).json({ error: 'Cash register already closed for this date' });
    }
    
    // Calculate expected closing cash
    const cashSales = await dbGet(
      `SELECT COALESCE(SUM(cash_amount), 0) as total 
       FROM invoices 
       WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
      [date]
    );
    
    const cashExpenses = await dbGet(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM expenses 
       WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
      [date]
    );
    
    const expectedClosingCash = entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0);
    const difference = closing_cash - expectedClosingCash;
    
    await dbRun(
      `UPDATE cash_register SET 
        closing_cash = ?, 
        expected_closing_cash = ?,
        difference = ?,
        notes = ?,
        closed_by = ?,
        closed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE date = ?`,
      [closing_cash, expectedClosingCash, difference, notes || entry.notes, closed_by || '', date]
    );
    
    const updatedEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [date]);
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update cash register entry
router.put('/:date', async (req, res) => {
  try {
    const { opening_cash, closing_cash, notes } = req.body;
    
    const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [req.params.date]);
    if (!entry) {
      return res.status(404).json({ error: 'Cash register entry not found' });
    }
    
    // Recalculate if closing_cash is being updated
    let expectedClosingCash = entry.expected_closing_cash;
    let difference = entry.difference;
    
    if (closing_cash !== undefined && closing_cash !== entry.closing_cash) {
      const cashSales = await dbGet(
        `SELECT COALESCE(SUM(cash_amount), 0) as total 
         FROM invoices 
         WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
        [req.params.date]
      );
      
      const cashExpenses = await dbGet(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM expenses 
         WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
        [req.params.date]
      );
      
      const finalOpeningCash = opening_cash !== undefined ? opening_cash : entry.opening_cash;
      expectedClosingCash = finalOpeningCash + (cashSales?.total || 0) - (cashExpenses?.total || 0);
      difference = closing_cash - expectedClosingCash;
    }
    
    await dbRun(
      `UPDATE cash_register SET 
        opening_cash = ?,
        closing_cash = ?,
        expected_closing_cash = ?,
        difference = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE date = ?`,
      [
        opening_cash !== undefined ? opening_cash : entry.opening_cash,
        closing_cash !== undefined ? closing_cash : entry.closing_cash,
        expectedClosingCash,
        difference,
        notes !== undefined ? notes : entry.notes,
        req.params.date
      ]
    );
    
    const updatedEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [req.params.date]);
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete cash register entry
router.delete('/:date', async (req, res) => {
  try {
    const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [req.params.date]);
    
    if (!entry) {
      return res.status(404).json({ error: 'Cash register entry not found' });
    }
    
    await dbRun('DELETE FROM cash_register WHERE date = ?', [req.params.date]);
    res.json({ message: 'Cash register entry deleted successfully', entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual automation (for testing or manual run)
router.post('/automation/run', async (req, res) => {
  try {
    const results = await cashRegisterAutomation.runDailyAutomation();
    res.json({
      message: 'Cash register automation completed',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-close yesterday's register
router.post('/automation/auto-close-yesterday', async (req, res) => {
  try {
    const result = await cashRegisterAutomation.autoCloseYesterdayRegister();
    
    if (!result) {
      return res.json({ message: 'No action needed - register already closed or not found' });
    }
    
    res.json({
      message: 'Yesterday\'s register auto-closed successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-open today's register
router.post('/automation/auto-open-today', async (req, res) => {
  try {
    const result = await cashRegisterAutomation.autoOpenTodayRegister();
    
    if (!result) {
      return res.json({ message: 'No action needed - register already opened' });
    }
    
    res.json({
      message: 'Today\'s register auto-opened successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
