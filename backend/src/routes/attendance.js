const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const { date, staff_id, startDate, endDate } = req.query;
    
    let query = `
      SELECT a.*, s.name as staff_name, s.position as staff_position 
      FROM attendance a
      LEFT JOIN staff s ON a.staff_id = s.id
      WHERE 1=1
    `;
    let params = [];
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    if (staff_id) {
      query += ' AND a.staff_id = ?';
      params.push(staff_id);
    }
    
    if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY a.date DESC, s.name ASC';
    
    const attendance = await dbAll(query, params);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance by ID
router.get('/:id', async (req, res) => {
  try {
    const attendance = await dbGet(
      `SELECT a.*, s.name as staff_name, s.position as staff_position 
       FROM attendance a
       LEFT JOIN staff s ON a.staff_id = s.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance (create)
router.post('/', async (req, res) => {
  try {
    const { staff_id, date, check_in, check_out, status, notes } = req.body;
    
    // Validation
    if (!staff_id || !date || !check_in) {
      return res.status(400).json({ error: 'Staff ID, date, and check-in time are required' });
    }
    
    // Check if staff exists
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [staff_id]);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Check if attendance already exists for this staff on this date
    const existing = await dbGet(
      'SELECT * FROM attendance WHERE staff_id = ? AND date = ?',
      [staff_id, date]
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this staff member on this date' });
    }
    
    const result = await dbRun(
      `INSERT INTO attendance (staff_id, date, check_in, check_out, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [staff_id, date, check_in, check_out || null, status || 'present', notes || '']
    );
    
    const attendance = await dbGet(
      `SELECT a.*, s.name as staff_name, s.position as staff_position 
       FROM attendance a
       LEFT JOIN staff s ON a.staff_id = s.id
       WHERE a.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance
router.put('/:id', async (req, res) => {
  try {
    const { check_in, check_out, status, notes } = req.body;
    
    // Check if attendance exists
    const existing = await dbGet('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    await dbRun(
      `UPDATE attendance SET 
        check_in = ?, check_out = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        check_in || existing.check_in,
        check_out !== undefined ? check_out : existing.check_out,
        status || existing.status,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );
    
    const attendance = await dbGet(
      `SELECT a.*, s.name as staff_name, s.position as staff_position 
       FROM attendance a
       LEFT JOIN staff s ON a.staff_id = s.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await dbGet('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    await dbRun('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Attendance record deleted successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT status, COUNT(*) as count FROM attendance';
    let params = [];
    
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    query += ' GROUP BY status';
    
    const statusStats = await dbAll(query, params);
    
    // Get total records
    let totalQuery = 'SELECT COUNT(*) as total FROM attendance';
    if (startDate && endDate) {
      totalQuery += ' WHERE date BETWEEN ? AND ?';
    }
    
    const totalStats = await dbGet(totalQuery, params);
    
    res.json({
      total: totalStats.total || 0,
      byStatus: statusStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk mark attendance for a date
router.post('/bulk', async (req, res) => {
  try {
    const { date, records } = req.body;
    
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }
    
    const results = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const { staff_id, check_in, check_out, status, notes } = record;
        
        // Check if attendance already exists
        const existing = await dbGet(
          'SELECT * FROM attendance WHERE staff_id = ? AND date = ?',
          [staff_id, date]
        );
        
        if (existing) {
          errors.push({ staff_id, error: 'Attendance already marked' });
          continue;
        }
        
        const result = await dbRun(
          `INSERT INTO attendance (staff_id, date, check_in, check_out, status, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [staff_id, date, check_in, check_out || null, status || 'present', notes || '']
        );
        
        results.push({ staff_id, id: result.lastID });
      } catch (err) {
        errors.push({ staff_id: record.staff_id, error: err.message });
      }
    }
    
    res.json({ 
      success: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
