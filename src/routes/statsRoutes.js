const express = require('express');
const { listWebsiteStats } = require('../controllers/statsController');
const { protect, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, requireAdmin, listWebsiteStats);

module.exports = router;

