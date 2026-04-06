const Attendance = require('../models/Attendance');
const { getTodayDate } = require('../services/attendanceService');

const autoCheckout = async (req, res) => {
  try {
    // Guard: only allow this endpoint to run if it's actually close to 8 PM IST
    // This prevents accidental calls from checking out everyone at the wrong time
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const istHour = nowIST.getUTCHours();
    const istMinute = nowIST.getUTCMinutes();
    const totalISTMinutes = istHour * 60 + istMinute;
    // Allow only between 7:55 PM and 8:05 PM IST (1195–1205 minutes)
    if (totalISTMinutes < 1195 || totalISTMinutes > 1205) {
      return res.status(400).json({
        success: false,
        message: `Auto-checkout can only run at 8 PM IST. Current IST time: ${String(istHour).padStart(2,'0')}:${String(istMinute).padStart(2,'0')}`,
      });
    }

    const today = getTodayDate(); // IST-aware

    // Use IST date parts to build the correct UTC checkout timestamp
    const checkoutUTC = new Date(Date.UTC(
      nowIST.getUTCFullYear(),
      nowIST.getUTCMonth(),
      nowIST.getUTCDate(),
      14, 30, 0, 0  // 14:30 UTC = 8:00 PM IST
    ));

    // Only update records not already auto-checked-out
    const result = await Attendance.updateMany(
      {
        date: today,
        checkInTime: { $ne: null },
        checkOutTime: null,
        autoCheckout: { $ne: true },
      },
      { $set: { checkOutTime: checkoutUTC, autoCheckout: true } }
    );

    // Recalculate work hours for newly modified records
    // (updateMany bypasses mongoose pre-save middleware)
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
      }
    }

    console.log(`[CRON HTTP] Auto-checkout applied to ${result.modifiedCount} records`);
    res.json({ success: true, modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('[CRON HTTP] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Undo a bad auto-checkout for a specific date (for recovery)
const undoAutoCheckout = async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD in IST
    if (!date) return res.status(400).json({ success: false, message: 'date required (YYYY-MM-DD)' });

    const result = await Attendance.updateMany(
      { date, autoCheckout: true },
      { $set: { checkOutTime: null, autoCheckout: false, workHours: 0 } }
    );

    console.log(`[CRON] Undo auto-checkout for ${date}: ${result.modifiedCount} records reverted`);
    res.json({ success: true, revertedCount: result.modifiedCount });
  } catch (error) {
    console.error('[CRON] Undo error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { autoCheckout, undoAutoCheckout };
