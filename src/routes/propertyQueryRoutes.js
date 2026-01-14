const express = require('express');
const { createPropertyQuery, listQueriesForProperty, listAllQueries } = require('../controllers/propertyQueryController');
const { protect, requireAdmin, requireUser } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

router.post('/', protect, requireUser, createPropertyQuery);
router.get('/', protect, listQueriesForProperty);

const adminRouter = express.Router();
adminRouter.get('/', protect, requireAdmin, listAllQueries);

module.exports = { router, adminRouter };
