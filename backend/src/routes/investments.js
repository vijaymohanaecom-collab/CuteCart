const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all investments
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, person } = req.query;
    
    let query = 'SELECT * FROM investments WHERE 1=1';
    let params = [];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (person) {
      query += ' AND person = ?';
      params.push(person);
    }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    const investments = await dbAll(query, params);
    res.json(investments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get investment statistics
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    // Total investments
    const totalResult = await dbGet(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM investments
      ${dateFilter}
    `, params);
    
    // Investments by person
    const byPerson = await dbAll(`
      SELECT 
        person,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM investments
      ${dateFilter}
      GROUP BY person
      ORDER BY total_amount DESC
    `, params);
    
    // Recent investments (last 30 days)
    const recentResult = await dbGet(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM investments
      WHERE date >= date('now', '-30 days')
    `);
    
    // This month's investments
    const thisMonthResult = await dbGet(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM investments
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);
    
    // Top investor
    const topInvestor = await dbGet(`
      SELECT 
        person,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as investment_count
      FROM investments
      ${dateFilter}
      GROUP BY person
      ORDER BY total_amount DESC
      LIMIT 1
    `, params);
    
    res.json({
      totalInvestments: totalResult.total_count || 0,
      totalAmount: totalResult.total_amount || 0,
      recentInvestments: recentResult.count || 0,
      recentAmount: recentResult.amount || 0,
      thisMonthInvestments: thisMonthResult.count || 0,
      thisMonthAmount: thisMonthResult.amount || 0,
      byPerson: byPerson || [],
      topInvestor: topInvestor || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique persons list
router.get('/persons', async (req, res) => {
  try {
    const persons = await dbAll(`
      SELECT DISTINCT person 
      FROM investments 
      ORDER BY person
    `);
    res.json(persons.map(p => p.person));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single investment
router.get('/:id', async (req, res) => {
  try {
    const investment = await dbGet('SELECT * FROM investments WHERE id = ?', [req.params.id]);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create investment
router.post('/', async (req, res) => {
  try {
    const { date, description, person, amount, notes } = req.body;
    
    if (!date || !description || !person || amount === undefined) {
      return res.status(400).json({ error: 'Date, description, person, and amount are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const result = await dbRun(
      'INSERT INTO investments (date, description, person, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [date, description, person, parseFloat(amount), notes || '']
    );
    
    const investment = await dbGet('SELECT * FROM investments WHERE id = ?', [result.id]);
    res.status(201).json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update investment
router.put('/:id', async (req, res) => {
  try {
    const { date, description, person, amount, notes } = req.body;
    
    if (!date || !description || !person || amount === undefined) {
      return res.status(400).json({ error: 'Date, description, person, and amount are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    await dbRun(
      'UPDATE investments SET date = ?, description = ?, person = ?, amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [date, description, person, parseFloat(amount), notes || '', req.params.id]
    );
    
    const investment = await dbGet('SELECT * FROM investments WHERE id = ?', [req.params.id]);
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete investment
router.delete('/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM investments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
