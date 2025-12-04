const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await dbAll('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const expenses = await dbAll(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { date, category, description, amount, payment_method, notes, created_by } = req.body;
    
    // Validation
    if (!date || !category || !description || !amount) {
      return res.status(400).json({ error: 'Date, category, description, and amount are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const result = await dbRun(
      `INSERT INTO expenses (date, category, description, amount, payment_method, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, category, description, amount, payment_method || 'cash', notes || '', created_by || '']
    );
    
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { date, category, description, amount, payment_method, notes } = req.body;
    
    // Check if expense exists
    const existing = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    await dbRun(
      `UPDATE expenses SET 
        date = ?, category = ?, description = ?, amount = ?, 
        payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        date || existing.date,
        category || existing.category,
        description || existing.description,
        amount || existing.amount,
        payment_method || existing.payment_method,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );
    
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    await dbRun('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted successfully', expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT category, SUM(amount) as total FROM expenses';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    query += ' GROUP BY category ORDER BY total DESC';
    
    const categoryStats = await dbAll(query, params);
    
    // Get total expenses
    let totalQuery = 'SELECT SUM(amount) as total, COUNT(*) as count FROM expenses';
    if (startDate && endDate) {
      totalQuery += ' WHERE date BETWEEN ? AND ?';
    }
    
    const totalStats = await dbGet(totalQuery, params);
    
    res.json({
      total: totalStats.total || 0,
      count: totalStats.count || 0,
      byCategory: categoryStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
