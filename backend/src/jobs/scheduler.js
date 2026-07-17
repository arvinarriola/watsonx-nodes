const cron = require('node-cron');
const { dispatchScheduled } = require('../services/notificationService');

// Run every minute — the dispatch function checks each post's schedule internally
cron.schedule('* * * * *', async () => {
  try {
    await dispatchScheduled();
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
  }
});

console.log('[Scheduler] Cron job registered — running every minute');
