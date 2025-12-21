const { dbGet, dbRun, dbAll } = require('../config/database');

class StockService {
  async addStock(productId, quantity, purchasePrice, salePrice, notes = '', addedBy = '') {
    try {
      const product = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const currentStock = product.stock || 0;
      const currentPurchasePrice = product.purchase_price || 0;
      const currentSalePrice = product.price || 0;

      const newTotalStock = currentStock + quantity;

      let newAvgPurchasePrice;
      if (currentStock === 0) {
        newAvgPurchasePrice = purchasePrice;
      } else {
        const totalCurrentValue = currentStock * currentPurchasePrice;
        const totalNewValue = quantity * purchasePrice;
        newAvgPurchasePrice = (totalCurrentValue + totalNewValue) / newTotalStock;
      }

      const newSalePrice = salePrice;

      const profitPerUnit = newSalePrice - newAvgPurchasePrice;
      const profitMarginPercent = newAvgPurchasePrice > 0 
        ? ((profitPerUnit / newAvgPurchasePrice) * 100) 
        : 0;

      await dbRun(
        `INSERT INTO stock_batches (product_id, quantity, purchase_price, sale_price, notes, added_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, quantity, purchasePrice, salePrice, notes, addedBy]
      );

      await dbRun(
        `UPDATE products SET 
          stock = ?, 
          purchase_price = ?, 
          price = ?,
          updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newTotalStock, newAvgPurchasePrice, newSalePrice, productId]
      );

      const updatedProduct = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);

      return {
        product: updatedProduct,
        stockAdded: quantity,
        oldStock: currentStock,
        newStock: newTotalStock,
        oldPurchasePrice: currentPurchasePrice,
        newAvgPurchasePrice: newAvgPurchasePrice,
        oldSalePrice: currentSalePrice,
        newSalePrice: newSalePrice,
        profitPerUnit: profitPerUnit,
        profitMarginPercent: profitMarginPercent
      };
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  async getStockHistory(productId, limit = 50) {
    try {
      const batches = await dbAll(
        `SELECT * FROM stock_batches 
         WHERE product_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [productId, limit]
      );
      
      return batches;
    } catch (error) {
      console.error('Error getting stock history:', error);
      throw error;
    }
  }

  async getAllStockHistory(limit = 100) {
    try {
      const batches = await dbAll(
        `SELECT sb.*, p.name as product_name 
         FROM stock_batches sb
         LEFT JOIN products p ON sb.product_id = p.id
         ORDER BY sb.created_at DESC 
         LIMIT ?`,
        [limit]
      );
      
      return batches;
    } catch (error) {
      console.error('Error getting all stock history:', error);
      throw error;
    }
  }

  async getProductStockSummary(productId) {
    try {
      const product = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const batches = await this.getStockHistory(productId);
      
      const totalStockAdded = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const avgBatchSize = batches.length > 0 ? totalStockAdded / batches.length : 0;

      const profitPerUnit = product.price - product.purchase_price;
      const profitMarginPercent = product.purchase_price > 0 
        ? ((profitPerUnit / product.purchase_price) * 100) 
        : 0;

      return {
        product,
        currentStock: product.stock,
        avgPurchasePrice: product.purchase_price,
        salePrice: product.price,
        profitPerUnit,
        profitMarginPercent,
        totalBatches: batches.length,
        totalStockAdded,
        avgBatchSize,
        recentBatches: batches.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting product stock summary:', error);
      throw error;
    }
  }
}

module.exports = new StockService();
