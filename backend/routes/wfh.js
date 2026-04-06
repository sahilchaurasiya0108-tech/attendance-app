const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createRequest,
  getMyStatus,
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/wfhController');

// Employee
router.post('/request', protect, createRequest);
router.get('/my-status', protect, getMyStatus);

// Admin
router.get('/requests', protect, adminOnly, getAllRequests);
router.put('/requests/:id/approve', protect, adminOnly, approveRequest);
router.put('/requests/:id/reject', protect, adminOnly, rejectRequest);

module.exports = router;
