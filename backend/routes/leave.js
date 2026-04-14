const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createLeaveRequest,
  getMyLeaves,
  cancelLeaveRequest,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getEmployeeLeaveSummary,
} = require('../controllers/leaveController');

// Employee
router.post('/request', protect, createLeaveRequest);
router.get('/my-leaves', protect, getMyLeaves);
router.delete('/:id', protect, cancelLeaveRequest);

// Admin
router.get('/requests', protect, adminOnly, getAllLeaveRequests);
router.put('/requests/:id/approve', protect, adminOnly, approveLeaveRequest);
router.put('/requests/:id/reject', protect, adminOnly, rejectLeaveRequest);
router.get('/summary/:userId', protect, adminOnly, getEmployeeLeaveSummary);

module.exports = router;