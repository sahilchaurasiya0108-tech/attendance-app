const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getHistory,
  getStats,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { validateAttendance } = require('../middleware/validation');

router.post('/checkin', protect, validateAttendance, checkIn);
router.post('/checkout', protect, validateAttendance, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/history', protect, getHistory);
router.get('/stats', protect, getStats);

module.exports = router;
