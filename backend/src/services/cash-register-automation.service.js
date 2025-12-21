const { dbGet, dbRun, dbAll } = require('../config/database');
const notificationService = require('./notification.service');

class CashRegisterAutomationService {
  async autoCloseYesterdayRegister() {
    try {
      const yesterday = this.getYesterdayDate();
      console.log(`Checking cash register for ${yesterday}...`);

      const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [yesterday]);

      if (!entry) {
        console.log(`No cash register entry found for ${yesterday}`);
        return null;
      }

      if (entry.closing_cash !== null) {
        console.log(`Cash register for ${yesterday} is already closed`);
        return null;
      }

      const cashSales = await dbGet(
        `SELECT COALESCE(SUM(cash_amount), 0) as total 
         FROM invoices 
         WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
        [yesterday]
      );

      const cashExpenses = await dbGet(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM expenses 
         WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
        [yesterday]
      );

      const expectedClosingCash = entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0);

      await dbRun(
        `UPDATE cash_register SET 
          closing_cash = ?, 
          expected_closing_cash = ?,
          difference = 0,
          status = 'closed',
          is_auto_closed = 1,
          closed_by = 'system',
          closed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ?`,
        [expectedClosingCash, expectedClosingCash, yesterday]
      );

      await notificationService.createNotification(
        'cash_register_auto_closed',
        'Cash Register Auto-Closed',
        `Cash register for ${yesterday} was automatically closed with balance ₹${expectedClosingCash.toFixed(2)}. Please verify and update if there are any discrepancies.`,
        yesterday,
        entry.id
      );

      console.log(`✓ Auto-closed cash register for ${yesterday} with balance ₹${expectedClosingCash.toFixed(2)}`);
      
      return {
        date: yesterday,
        closingCash: expectedClosingCash,
        autoClosePerformed: true
      };
    } catch (error) {
      console.error('Error auto-closing yesterday register:', error);
      throw error;
    }
  }

  async autoOpenTodayRegister() {
    try {
      const today = this.getTodayDate();
      console.log(`Checking cash register for ${today}...`);

      const existingEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [today]);

      if (existingEntry) {
        console.log(`Cash register for ${today} is already opened`);
        return null;
      }

      const yesterday = this.getYesterdayDate();
      const yesterdayEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [yesterday]);

      let openingCash = 0;
      let notes = 'Auto-opened with zero balance';

      if (yesterdayEntry && yesterdayEntry.closing_cash !== null) {
        openingCash = yesterdayEntry.closing_cash;
        notes = `Auto-opened with yesterday's closing balance (${yesterdayEntry.is_auto_closed ? 'auto-closed' : 'manually closed'})`;
      }

      const result = await dbRun(
        `INSERT INTO cash_register (date, opening_cash, notes, created_by, status, is_auto_opened) 
         VALUES (?, ?, ?, 'system', 'open', 1)`,
        [today, openingCash, notes]
      );

      await notificationService.createNotification(
        'cash_register_auto_opened',
        'Cash Register Auto-Opened',
        `Cash register for ${today} was automatically opened with balance ₹${openingCash.toFixed(2)}. Please verify and update if needed.`,
        today,
        result.lastID
      );

      console.log(`✓ Auto-opened cash register for ${today} with balance ₹${openingCash.toFixed(2)}`);

      return {
        date: today,
        openingCash: openingCash,
        autoOpenPerformed: true
      };
    } catch (error) {
      console.error('Error auto-opening today register:', error);
      throw error;
    }
  }

  async runDailyAutomation() {
    console.log('Running daily cash register automation...');
    
    const results = {
      autoClose: null,
      autoOpen: null,
      timestamp: new Date().toISOString()
    };

    try {
      results.autoClose = await this.autoCloseYesterdayRegister();
      results.autoOpen = await this.autoOpenTodayRegister();
      
      console.log('✓ Daily cash register automation completed');
      return results;
    } catch (error) {
      console.error('Error in daily automation:', error);
      throw error;
    }
  }

  async adjustCashRegisterForBackdatedExpense(expenseDate, expenseAmount, paymentMethod) {
    try {
      if (paymentMethod !== 'cash') {
        return null;
      }

      const today = this.getTodayDate();
      
      if (expenseDate >= today) {
        return null;
      }

      const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [expenseDate]);

      if (!entry) {
        console.log(`No cash register entry found for backdated expense on ${expenseDate}`);
        return null;
      }

      const cashSales = await dbGet(
        `SELECT COALESCE(SUM(cash_amount), 0) as total 
         FROM invoices 
         WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
        [expenseDate]
      );

      const cashExpenses = await dbGet(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM expenses 
         WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
        [expenseDate]
      );

      const newExpectedClosingCash = entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0);
      const newDifference = (entry.closing_cash || 0) - newExpectedClosingCash;

      await dbRun(
        `UPDATE cash_register SET 
          expected_closing_cash = ?,
          difference = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ?`,
        [newExpectedClosingCash, newDifference, expenseDate]
      );

      await notificationService.createNotification(
        'cash_register_adjusted',
        'Cash Register Adjusted',
        `Cash register for ${expenseDate} was adjusted due to a backdated expense of ₹${expenseAmount.toFixed(2)}. New expected closing: ₹${newExpectedClosingCash.toFixed(2)}, Difference: ₹${newDifference.toFixed(2)}`,
        expenseDate,
        entry.id
      );

      console.log(`✓ Adjusted cash register for ${expenseDate} due to backdated expense`);

      return {
        date: expenseDate,
        newExpectedClosingCash,
        newDifference,
        adjustmentPerformed: true
      };
    } catch (error) {
      console.error('Error adjusting cash register for backdated expense:', error);
      throw error;
    }
  }

  async adjustCashRegisterForUpdatedExpense(oldExpense, newExpense) {
    try {
      const today = this.getTodayDate();
      const datesToAdjust = new Set();

      if (oldExpense.payment_method === 'cash' && oldExpense.date < today) {
        datesToAdjust.add(oldExpense.date);
      }

      if (newExpense.payment_method === 'cash' && newExpense.date < today) {
        datesToAdjust.add(newExpense.date);
      }

      const adjustments = [];

      for (const date of datesToAdjust) {
        const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [date]);

        if (!entry) continue;

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

        const newExpectedClosingCash = entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0);
        const newDifference = (entry.closing_cash || 0) - newExpectedClosingCash;

        await dbRun(
          `UPDATE cash_register SET 
            expected_closing_cash = ?,
            difference = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE date = ?`,
          [newExpectedClosingCash, newDifference, date]
        );

        await notificationService.createNotification(
          'cash_register_adjusted',
          'Cash Register Adjusted',
          `Cash register for ${date} was adjusted due to an updated expense. New expected closing: ₹${newExpectedClosingCash.toFixed(2)}, Difference: ₹${newDifference.toFixed(2)}`,
          date,
          entry.id
        );

        adjustments.push({
          date,
          newExpectedClosingCash,
          newDifference
        });
      }

      return adjustments;
    } catch (error) {
      console.error('Error adjusting cash register for updated expense:', error);
      throw error;
    }
  }

  async adjustCashRegisterForDeletedExpense(expense) {
    try {
      if (expense.payment_method !== 'cash') {
        return null;
      }

      const today = this.getTodayDate();
      
      if (expense.date >= today) {
        return null;
      }

      const entry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [expense.date]);

      if (!entry) {
        return null;
      }

      const cashSales = await dbGet(
        `SELECT COALESCE(SUM(cash_amount), 0) as total 
         FROM invoices 
         WHERE substr(created_at, 1, 10) = ? AND cash_amount > 0`,
        [expense.date]
      );

      const cashExpenses = await dbGet(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM expenses 
         WHERE substr(date, 1, 10) = ? AND payment_method = 'cash'`,
        [expense.date]
      );

      const newExpectedClosingCash = entry.opening_cash + (cashSales?.total || 0) - (cashExpenses?.total || 0);
      const newDifference = (entry.closing_cash || 0) - newExpectedClosingCash;

      await dbRun(
        `UPDATE cash_register SET 
          expected_closing_cash = ?,
          difference = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ?`,
        [newExpectedClosingCash, newDifference, expense.date]
      );

      await notificationService.createNotification(
        'cash_register_adjusted',
        'Cash Register Adjusted',
        `Cash register for ${expense.date} was adjusted due to a deleted expense of ₹${expense.amount.toFixed(2)}. New expected closing: ₹${newExpectedClosingCash.toFixed(2)}, Difference: ₹${newDifference.toFixed(2)}`,
        expense.date,
        entry.id
      );

      return {
        date: expense.date,
        newExpectedClosingCash,
        newDifference,
        adjustmentPerformed: true
      };
    } catch (error) {
      console.error('Error adjusting cash register for deleted expense:', error);
      throw error;
    }
  }

  async checkAndRunStartupAutomation() {
    try {
      console.log('\n=== Cash Register Startup Check ===');
      const today = this.getTodayDate();
      const yesterday = this.getYesterdayDate();
      
      let actionsPerformed = false;

      // Check if yesterday's register needs to be closed
      const yesterdayEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [yesterday]);
      if (yesterdayEntry && yesterdayEntry.closing_cash === null) {
        console.log(`⚠️  Yesterday's register (${yesterday}) is still open - auto-closing now...`);
        await this.autoCloseYesterdayRegister();
        actionsPerformed = true;
      } else if (yesterdayEntry) {
        console.log(`✓ Yesterday's register (${yesterday}) is already closed`);
      } else {
        console.log(`ℹ️  No register entry found for yesterday (${yesterday})`);
      }

      // Check if today's register needs to be opened
      const todayEntry = await dbGet('SELECT * FROM cash_register WHERE date = ?', [today]);
      if (!todayEntry) {
        console.log(`⚠️  Today's register (${today}) is not open - auto-opening now...`);
        await this.autoOpenTodayRegister();
        actionsPerformed = true;
      } else {
        console.log(`✓ Today's register (${today}) is already open`);
      }

      if (!actionsPerformed) {
        console.log('✓ No startup automation needed - all registers are up to date');
      } else {
        console.log('✓ Startup automation completed successfully');
      }
      
      console.log('=== Startup Check Complete ===\n');
      
      return {
        yesterdayChecked: !!yesterdayEntry,
        yesterdayClosed: yesterdayEntry?.closing_cash !== null,
        todayChecked: true,
        todayOpened: !!todayEntry || actionsPerformed,
        actionsPerformed
      };
    } catch (error) {
      console.error('Error in startup automation check:', error);
      throw error;
    }
  }

  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}

module.exports = new CashRegisterAutomationService();
