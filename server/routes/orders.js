const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/auth');

router.post('/', protect, orderController.createOrder);
router.get('/my', protect, orderController.getMyOrders);
router.get('/my/:id', protect, orderController.getMyOrderById);
router.patch('/my/:id/cancel', protect, orderController.cancelMyOrder);
router.get('/', protect, isAdmin, orderController.getAllOrders);
router.get('/:id', protect, isAdmin, orderController.getOrderById);
router.patch('/:id/status', protect, isAdmin, orderController.updateOrderStatus);

module.exports = router;
