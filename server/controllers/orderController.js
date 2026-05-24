const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { items, totalPrice, shippingAddress } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'No items' });
    const order = await Order.create({ userId: req.user._id, items, totalPrice, shippingAddress });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
