const express = require('express');
const router = express.Router();
const { autoCheckout, undoAutoCheckout } = require('../controllers/cronController');

const cronAuth = (req, res, next) => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.post('/auto-checkout', cronAuth, autoCheckout);
router.post('/undo-auto-checkout', cronAuth, undoAutoCheckout);

module.exports = router;
