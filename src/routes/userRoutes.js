const express = require('express');
const { listAllUsers, searchAllUsers, setUserBlocked } = require('../controllers/userAuthController');
const { protect, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/search', protect, requireAdmin, searchAllUsers);
router.get('/', protect, requireAdmin, listAllUsers);
router.patch('/:id/block', protect, requireAdmin, setUserBlocked);

module.exports = router;
