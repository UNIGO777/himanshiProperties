const express = require('express');
const { createPropertyRating, listAllRatings, searchAllRatings, getRatingById } = require('../controllers/ratingController');
const { protect, requireAdmin, requireUser } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.post('/', protect, requireUser, createPropertyRating);

const adminRouter = express.Router();
adminRouter.get('/search', protect, requireAdmin, searchAllRatings);
adminRouter.get('/:id', protect, requireAdmin, getRatingById);
adminRouter.get('/', protect, requireAdmin, listAllRatings);

module.exports = { router, adminRouter };

