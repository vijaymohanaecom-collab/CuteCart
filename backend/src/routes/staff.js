const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM staff';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY name ASC';
    
    const staff = await dbAll(query, params);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
  try {
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new staff member
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, position, salary, joining_date, status, address, notes } = req.body;
    
    // Validation
    if (!name || !phone || !position || !salary || !joining_date) {
      return res.status(400).json({ error: 'Name, phone, position, salary, and joining date are required' });
    }
    
    if (salary < 0) {
      return res.status(400).json({ error: 'Salary must be non-negative' });
    }
    
    const result = await dbRun(
      `INSERT INTO staff (name, phone, email, position, salary, joining_date, status, address, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, email || '', position, salary, joining_date, status || 'active', address || '', notes || '']
    );
    
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [result.lastID]);
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff member
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, position, salary, joining_date, status, address, notes } = req.body;
    
    // Check if staff exists
    const existing = await dbGet('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Validation
    if (salary && salary < 0) {
      return res.status(400).json({ error: 'Salary must be non-negative' });
    }
    
    await dbRun(
      `UPDATE staff SET 
        name = ?, phone = ?, email = ?, position = ?, salary = ?, 
        joining_date = ?, status = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name || existing.name,
        phone || existing.phone,
        email !== undefined ? email : existing.email,
        position || existing.position,
        salary !== undefined ? salary : existing.salary,
        joining_date || existing.joining_date,
        status || existing.status,
        address !== undefined ? address : existing.address,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );
    
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    await dbRun('DELETE FROM staff WHERE id = ?', [req.params.id]);
    res.json({ message: 'Staff member deleted successfully', staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalStaff = await dbGet('SELECT COUNT(*) as count FROM staff WHERE status = "active"');
    const totalSalary = await dbGet('SELECT SUM(salary) as total FROM staff WHERE status = "active"');
    const byPosition = await dbAll(
      'SELECT position, COUNT(*) as count FROM staff WHERE status = "active" GROUP BY position ORDER BY count DESC'
    );
    
    res.json({
      totalStaff: totalStaff.count || 0,
      totalSalary: totalSalary.total || 0,
      byPosition: byPosition
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
