const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../config/database');

// Get all customers with statistics
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params = [startDate, endDate + ' 23:59:59'];
    }
    
    const customers = await dbAll(`
      SELECT 
        customer_name,
        customer_phone,
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as avg_purchase_value,
        MIN(created_at) as first_purchase_date,
        MAX(created_at) as last_purchase_date,
        CASE 
          WHEN julianday('now') - julianday(MAX(created_at)) <= 7 THEN 'active'
          ELSE 'inactive'
        END as status
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != ''
      ${dateFilter}
      GROUP BY customer_name, customer_phone
      ORDER BY last_purchase_date DESC
    `, params);
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer statistics
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      params = [startDate, endDate + ' 23:59:59'];
    }
    
    // Total unique customers
    const totalCustomers = await dbGet(`
      SELECT COUNT(DISTINCT customer_name || '-' || COALESCE(customer_phone, '')) as count
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != ''
      ${dateFilter ? (dateFilter.includes('WHERE') ? dateFilter : 'WHERE ' + dateFilter.replace('AND', '')) : ''}
    `, params);
    
    // New customers (first purchase in date range)
    const newCustomersQuery = startDate && endDate ? `
      SELECT COUNT(*) as count FROM (
        SELECT customer_name, customer_phone, MIN(created_at) as first_purchase
        FROM invoices
        WHERE customer_name IS NOT NULL AND customer_name != ''
        GROUP BY customer_name, customer_phone
        HAVING first_purchase BETWEEN ? AND ?
      )
    ` : `
      SELECT COUNT(DISTINCT customer_name || '-' || COALESCE(customer_phone, '')) as count
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != ''
      AND created_at >= date('now', '-7 days')
    `;
    
    const newCustomers = await dbGet(
      newCustomersQuery,
      startDate && endDate ? [startDate, endDate + ' 23:59:59'] : []
    );
    
    // Active customers (purchased in last 7 days)
    const activeCustomers = await dbGet(`
      SELECT COUNT(DISTINCT customer_name || '-' || COALESCE(customer_phone, '')) as count
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != ''
      AND created_at >= date('now', '-7 days')
    `);
    
    // Inactive customers (not purchased in last 7 days but have purchased before)
    const inactiveCustomers = await dbGet(`
      SELECT COUNT(*) as count FROM (
        SELECT customer_name, customer_phone, MAX(created_at) as last_purchase
        FROM invoices
        WHERE customer_name IS NOT NULL AND customer_name != ''
        GROUP BY customer_name, customer_phone
        HAVING julianday('now') - julianday(last_purchase) > 7
      )
    `);
    
    // Average purchase value
    const avgPurchaseValue = await dbGet(`
      SELECT COALESCE(AVG(total), 0) as avg_value
      FROM invoices
      WHERE customer_name IS NOT NULL AND customer_name != ''
      ${dateFilter}
    `, params);
    
    // Top customer
    const topCustomer = await dbGet(`
      SELECT 
        customer_name,
        customer_phone,
        COALESCE(SUM(total), 0) as total_spent
      FROM invoices
      WHERE customer_name IS NOT NULL AND customer_name != ''
      ${dateFilter}
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC
      LIMIT 1
    `, params);
    
    res.json({
      totalCustomers: totalCustomers.count || 0,
      newCustomers: newCustomers.count || 0,
      activeCustomers: activeCustomers.count || 0,
      inactiveCustomers: inactiveCustomers.count || 0,
      avgPurchaseValue: avgPurchaseValue.avg_value || 0,
      topCustomer: topCustomer || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export customers to CSV (must come before /:name/:phone? to avoid route conflicts)
router.get('/export/csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params = [startDate, endDate + ' 23:59:59'];
    }
    
    const customers = await dbAll(`
      SELECT 
        customer_name,
        customer_phone,
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as avg_purchase_value,
        MIN(created_at) as first_purchase_date,
        MAX(created_at) as last_purchase_date,
        CASE 
          WHEN julianday('now') - julianday(MAX(created_at)) <= 7 THEN 'Active'
          ELSE 'Inactive'
        END as status
      FROM invoices 
      WHERE customer_name IS NOT NULL AND customer_name != ''
      ${dateFilter}
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC
    `, params);
    
    // Create CSV header
    const csvHeader = 'Name,Phone,Total Purchases,Total Spent,Avg Purchase Value,First Purchase,Last Purchase,Status\n';
    
    // Create CSV rows
    const csvRows = customers.map(c => {
      const name = (c.customer_name || '').replace(/"/g, '""');
      const phone = (c.customer_phone || '').replace(/"/g, '""');
      const firstDate = c.first_purchase_date ? new Date(c.first_purchase_date).toLocaleDateString() : '';
      const lastDate = c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString() : '';
      
      return `"${name}","${phone}",${c.total_purchases},${c.total_spent.toFixed(2)},${c.avg_purchase_value.toFixed(2)},"${firstDate}","${lastDate}","${c.status}"`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single customer details
router.get('/:name/:phone?', async (req, res) => {
  try {
    const { name, phone } = req.params;
    
    let query = `
      SELECT 
        i.*
      FROM invoices i
      WHERE i.customer_name = ?
    `;
    
    const params = [name];
    
    if (phone && phone !== 'undefined') {
      query += ' AND i.customer_phone = ?';
      params.push(phone);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const purchases = await dbAll(query, params);
    
    if (purchases.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const stats = {
      customer_name: name,
      customer_phone: phone || '',
      total_purchases: purchases.length,
      total_spent: purchases.reduce((sum, p) => sum + p.total, 0),
      avg_purchase_value: purchases.reduce((sum, p) => sum + p.total, 0) / purchases.length,
      first_purchase_date: purchases[purchases.length - 1].created_at,
      last_purchase_date: purchases[0].created_at,
      purchases: purchases
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
