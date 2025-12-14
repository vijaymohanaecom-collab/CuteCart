const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../config/database');

// Get sales report with date range filtering
router.get('/sales', async (req, res) => {
  try {
    console.log('Reports API called with:', req.query);
    const { startDate, endDate, reportType } = req.query;
    
    let dateFilter = '';
    let dateFilterNoAlias = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(i.created_at) BETWEEN ? AND ?';
      dateFilterNoAlias = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    } else if (reportType === 'weekly') {
      dateFilter = 'WHERE DATE(i.created_at) >= DATE("now", "-7 days")';
      dateFilterNoAlias = 'WHERE DATE(created_at) >= DATE("now", "-7 days")';
    } else if (reportType === 'monthly') {
      dateFilter = 'WHERE DATE(i.created_at) >= DATE("now", "-30 days")';
      dateFilterNoAlias = 'WHERE DATE(created_at) >= DATE("now", "-30 days")';
    } else if (reportType === 'today') {
      dateFilter = 'WHERE DATE(i.created_at) = DATE("now")';
      dateFilterNoAlias = 'WHERE DATE(created_at) = DATE("now")';
    }
    
    // Get summary statistics
    // Get invoice totals separately to avoid double-counting when invoices have multiple items
    const invoiceStats = await dbGet(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount), 0) as total_discount
      FROM invoices
      ${dateFilterNoAlias}
    `, params) || {
      total_invoices: 0,
      total_sales: 0,
      total_subtotal: 0,
      total_tax: 0,
      total_discount: 0
    };
    
    // Get item statistics separately
    const itemStats = await dbGet(`
      SELECT 
        COALESCE(SUM(ii.quantity), 0) as total_items_sold,
        COALESCE(SUM(ii.total_price - (ii.purchase_price * ii.quantity)), 0) as total_profit
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ${dateFilter}
    `, params) || {
      total_items_sold: 0,
      total_profit: 0
    };
    
    // Combine the results
    const summary = {
      total_invoices: invoiceStats.total_invoices || 0,
      total_sales: invoiceStats.total_sales || 0,
      total_subtotal: invoiceStats.total_subtotal || 0,
      total_tax: invoiceStats.total_tax || 0,
      total_discount: invoiceStats.total_discount || 0,
      total_items_sold: itemStats.total_items_sold || 0,
      total_profit: itemStats.total_profit || 0
    };
    
    // Get payment method breakdown
    const paymentBreakdown = await dbAll(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total,
        COALESCE(SUM(cash_amount), 0) as cash_total,
        COALESCE(SUM(upi_amount), 0) as upi_total,
        COALESCE(SUM(card_amount), 0) as card_total
      FROM invoices
      ${dateFilterNoAlias}
      GROUP BY payment_method
    `, params);
    
    // Get top selling products (no limit to show all products)
    const topProducts = await dbAll(`
      SELECT 
        ii.product_name,
        SUM(ii.quantity) as quantity_sold,
        COALESCE(SUM(ii.total_price), 0) as total_revenue,
        COALESCE(SUM(ii.total_price - (ii.purchase_price * ii.quantity)), 0) as profit
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ${dateFilter}
      GROUP BY ii.product_id, ii.product_name
      ORDER BY quantity_sold DESC
    `, params);
    
    // Get category breakdown
    const categoryBreakdown = await dbAll(`
      SELECT 
        p.category,
        COUNT(DISTINCT ii.id) as items_count,
        SUM(ii.quantity) as quantity_sold,
        COALESCE(SUM(ii.total_price), 0) as total_revenue,
        COALESCE(SUM(ii.total_price - (ii.purchase_price * ii.quantity)), 0) as profit
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN invoices i ON ii.invoice_id = i.id
      ${dateFilter}
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `, params);
    
    // Get daily sales trend
    const dailySales = await dbAll(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total), 0) as total_sales
      FROM invoices
      ${dateFilterNoAlias}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);
    
    // Get hourly sales distribution (for today or custom range)
    const hourlySales = await dbAll(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total), 0) as total_sales
      FROM invoices
      ${dateFilterNoAlias}
      GROUP BY hour
      ORDER BY hour ASC
    `, params);
    
    // Get detailed invoice list
    const invoices = await dbAll(`
      SELECT 
        i.id,
        i.invoice_number,
        i.customer_name,
        i.customer_phone,
        i.total,
        i.subtotal,
        i.tax_amount,
        i.discount,
        i.payment_method,
        i.created_at,
        COUNT(ii.id) as items_count
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      ${dateFilter}
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, params);
    
    console.log('Report generated successfully');
    res.json({
      summary: summary || {
        total_invoices: 0,
        total_sales: 0,
        total_subtotal: 0,
        total_tax: 0,
        total_discount: 0,
        total_items_sold: 0,
        total_profit: 0
      },
      paymentBreakdown: paymentBreakdown || [],
      topProducts: topProducts || [],
      categoryBreakdown: categoryBreakdown || [],
      dailySales: dailySales || [],
      hourlySales: hourlySales || [],
      invoices: invoices || []
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get profit analysis
router.get('/profit', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(i.created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    const profitAnalysis = await dbAll(`
      SELECT 
        ii.product_name,
        ii.product_id,
        SUM(ii.quantity) as quantity_sold,
        AVG(ii.unit_price) as avg_selling_price,
        AVG(ii.purchase_price) as avg_purchase_price,
        COALESCE(SUM(ii.total_price), 0) as total_revenue,
        COALESCE(SUM(ii.purchase_price * ii.quantity), 0) as total_cost,
        COALESCE(SUM(ii.total_price - (ii.purchase_price * ii.quantity)), 0) as total_profit,
        CASE 
          WHEN SUM(ii.purchase_price * ii.quantity) > 0 
          THEN ROUND((SUM(ii.total_price - (ii.purchase_price * ii.quantity)) * 100.0 / SUM(ii.purchase_price * ii.quantity)), 2)
          ELSE 0 
        END as profit_margin_percent
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      ${dateFilter}
      GROUP BY ii.product_id, ii.product_name
      ORDER BY total_profit DESC
    `, params);
    
    res.json(profitAnalysis);
  } catch (error) {
    console.error('Error generating profit report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer insights
router.get('/customers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    }
    
    const customerInsights = await dbAll(`
      SELECT 
        customer_name,
        customer_phone,
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as avg_purchase_value,
        MAX(created_at) as last_purchase_date
      FROM invoices
      ${dateFilter}
      ${dateFilter ? 'AND' : 'WHERE'} customer_name IS NOT NULL AND customer_name != ''
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC
      LIMIT 50
    `, params);
    
    res.json(customerInsights);
  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
