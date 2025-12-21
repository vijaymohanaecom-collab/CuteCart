const { dbRun, dbGet, dbAll } = require('../config/database');

class NotificationService {
  async createNotification(type, title, message, relatedDate = null, relatedId = null) {
    try {
      const result = await dbRun(
        `INSERT INTO notifications (type, title, message, related_date, related_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [type, title, message, relatedDate, relatedId]
      );
      
      return await dbGet('SELECT * FROM notifications WHERE id = ?', [result.lastID]);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUnreadNotifications() {
    try {
      return await dbAll(
        'SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC'
      );
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  async getAllNotifications(limit = 50) {
    try {
      return await dbAll(
        'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markAsRead(id) {
    try {
      await dbRun(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      await dbRun('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id) {
    try {
      await dbRun('DELETE FROM notifications WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      await dbRun(
        'DELETE FROM notifications WHERE created_at < ? AND is_read = 1',
        [cutoffDate.toISOString()]
      );
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
