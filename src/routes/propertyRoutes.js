const express = require('express');
const {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
} = require('../controllers/propertyController');
const { protect, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/search', searchProperties);
router.get('/', listProperties);
router.get('/:id', getProperty);

router.post('/', protect, requireAdmin, createProperty);
router.put('/:id', protect, requireAdmin, updateProperty);
router.delete('/:id', protect, requireAdmin, deleteProperty);

module.exports = router;
