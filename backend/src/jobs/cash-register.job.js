const cron = require('node-cron');
const cashRegisterAutomation = require('../services/cash-register-automation.service');

function scheduleCashRegisterAutomation() {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled cash register automation at midnight...');
    try {
      await cashRegisterAutomation.runDailyAutomation();
    } catch (error) {
      console.error('Error in scheduled cash register automation:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✓ Cash register automation scheduled (daily at midnight IST)');
}

module.exports = { scheduleCashRegisterAutomation };
