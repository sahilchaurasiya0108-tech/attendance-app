const cron = require('node-cron');
const http = require('http');
const https = require('https');
const Attendance = require('../models/Attendance');
const { getTodayDate } = require('./attendanceService');
const { sendPushToUser } = require('./pushService');

const DATA_START_DATE = '2026-04-01';

// Self-ping to keep Render alive — hits our own /api/health endpoint
const selfPing = () => {
  const url = process.env.BACKEND_URL || 'https://attendance-app-backend-z0bq.onrender.com';
  const fullUrl = `${url}/api/health`;

  const client = fullUrl.startsWith('https') ? https : http;

  const req = client.get(fullUrl, (res) => {
    console.log(`[PING] Self-ping → ${res.statusCode}`);
    res.resume(); // discard response body
  });

  req.on('error', (err) => {
    console.warn(`[PING] Self-ping failed: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    console.warn('[PING] Self-ping timed out');
  });
};

const start = () => {

  // ── Keep-alive self-ping every 10 minutes, 8AM–9PM IST (2:30–15:30 UTC) ──
  // IST = UTC+5:30, so:
  //   8:00 AM IST = 02:30 UTC
  //   9:00 PM IST = 15:30 UTC
  // Cron: every 10 mins, from minute 30 of hour 2 through hour 15 UTC
  // We use two cron expressions to cover the full window cleanly:
  //   */10 3-14 * * *   → every 10 min from 03:00–14:59 UTC
  //   30,40,50 2 * * *  → 02:30, 02:40, 02:50 UTC (8:00, 8:10, 8:20 AM IST)
  //   0,10,20,30 15 * * * → 15:00–15:30 UTC (8:30–9:00 PM IST)

  cron.schedule('30,40,50 2 * * *', () => {
    console.log('[PING] Keep-alive ping (early morning window)');
    selfPing();
  });

  cron.schedule('*/10 3-14 * * *', () => {
    console.log('[PING] Keep-alive ping (main window)');
    selfPing();
  });

  cron.schedule('0,10,20,30 15 * * *', () => {
    console.log('[PING] Keep-alive ping (evening window)');
    selfPing();
  });

  // ── Auto checkout at 8 PM IST every day ──
  // 8:00 PM IST = 14:30 UTC  →  cron: 30 14 * * *
  cron.schedule('30 14 * * *', async () => {
    console.log('[CRON] Running auto-checkout job...');
    try {
      const today = getTodayDate(); // IST-aware date string

      // Build the checkout timestamp: today's date in IST at exactly 8:00 PM IST (14:30 UTC)
      // We use the IST date parts to avoid UTC date mismatch near midnight
      const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const checkoutUTC = new Date(Date.UTC(
        nowIST.getUTCFullYear(),
        nowIST.getUTCMonth(),
        nowIST.getUTCDate(),
        14, 30, 0, 0  // 14:30 UTC = 8:00 PM IST
      ));

      const result = await Attendance.updateMany(
        {
          date: today,
          checkInTime: { $ne: null },
          checkOutTime: null,
          autoCheckout: { $ne: true },
        },
        {
          $set: {
            checkOutTime: checkoutUTC,
            autoCheckout: true,
          },
        }
      );

      if (result.modifiedCount > 0) {
        const updated = await Attendance.find({
          date: today,
          autoCheckout: true,
          checkInTime: { $ne: null },
          checkOutTime: checkoutUTC,
        });

        for (const record of updated) {
          const diffMs = new Date(record.checkOutTime) - new Date(record.checkInTime);
          const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
          await Attendance.updateOne(
            { _id: record._id },
            { $set: { workHours: diffHours } }
          );
          // Notify employee their day was auto-closed
          const hrs = Math.floor(diffHours);
          const min = Math.round((diffHours - hrs) * 60);
          sendPushToUser(record.userId, {
            title: '🏁 Auto Check-Out',
            body: `You were auto checked out at 8 PM. Total: ${hrs}h ${min}m. Remember to check out manually next time!`,
            tag: 'auto-checkout',
            url: '/dashboard',
          }).catch(() => {});
        }
      }

      console.log(`[CRON] Auto-checkout applied to ${result.modifiedCount} records`);
    } catch (error) {
      console.error('[CRON] Auto-checkout error:', error.message);
    }
  });

  // ── Cleanup old data on startup ──
  (async () => {
    try {
      const deleted = await Attendance.deleteMany({ date: { $lt: DATA_START_DATE } });
      if (deleted.deletedCount > 0) {
        console.log(`[CLEANUP] Removed ${deleted.deletedCount} records before ${DATA_START_DATE}`);
      }
    } catch (err) {
      console.error('[CLEANUP] Error removing old records:', err.message);
    }
  })();

  console.log('[CRON] Jobs scheduled — keep-alive active 8AM–9PM IST');
};

module.exports = { start, DATA_START_DATE };