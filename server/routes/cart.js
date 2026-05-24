const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, cartController.getCart);
router.post('/', protect, cartController.addItem);
router.put('/', protect, cartController.updateItem);
router.delete('/:productId', protect, cartController.removeItem);

module.exports = router;