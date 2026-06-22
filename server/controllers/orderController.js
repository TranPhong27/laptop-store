const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const isUnavailable = (product) => product.status === 'hidden' || product.status === 'outOfStock' || product.stock <= 0;

const normalizeShippingAddress = (shippingAddress = {}) => ({
  fullName: String(shippingAddress.fullName || '').trim(),
  phone: String(shippingAddress.phone || '').trim(),
  address: String(shippingAddress.address || '').trim(),
  city: String(shippingAddress.city || '').trim(),
  postalCode: String(shippingAddress.postalCode || '').trim(),
  country: String(shippingAddress.country || 'Việt Nam').trim(),
});

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress.fullName) return 'Vui lòng nhập họ tên người nhận';
  if (!shippingAddress.phone) return 'Vui lòng nhập số điện thoại';
  if (!shippingAddress.address) return 'Vui lòng nhập địa chỉ giao hàng';
  if (!shippingAddress.city) return 'Vui lòng nhập tỉnh/thành phố';
  if (!shippingAddress.country) return 'Vui lòng nhập quốc gia';
  return '';
};

const orderStatuses = ['Pending', 'Confirmed', 'Shipping', 'Completed', 'Cancelled'];

const makeHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const restoreStock = async (items) => {
  if (!items.length) return;
  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } },
      },
    }))
  );
};

const reserveStock = async (items) => {
  const reserved = [];

  try {
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.productId, status: { $nin: ['hidden', 'outOfStock'] }, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (result.modifiedCount !== 1) {
        throw makeHttpError(`${item.name} không còn đủ tồn kho`);
      }

      reserved.push(item);
    }
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
};

exports.createOrder = async (req, res) => {
  let reservedItems = [];

  try {
    const shippingAddress = normalizeShippingAddress(req.body.shippingAddress);
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) return res.status(400).json({ message: addressError });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || !cart.items.length) return res.status(400).json({ message: 'Giỏ hàng đang trống' });

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const orderItems = [];
    for (const item of cart.items) {
      const product = productMap.get(String(item.productId));
      if (!product) return res.status(404).json({ message: `Sản phẩm ${item.name} không còn tồn tại` });
      if (isUnavailable(product)) return res.status(400).json({ message: `${product.name} hiện không thể đặt hàng` });
      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `${product.name} chỉ còn ${product.stock} sản phẩm` });
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await reserveStock(orderItems);
    reservedItems = orderItems;

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalPrice,
      paymentMethod: 'COD',
      paymentStatus: 'Unpaid',
      shippingAddress,
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json(order);
  } catch (err) {
    if (reservedItems.length) {
      await restoreStock(reservedItems);
    }
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' });
    }

    order.status = 'Cancelled';
    await order.save();
    await restoreStock(order.items);

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ message: 'Đơn đã hủy không thể đổi sang trạng thái khác' });
    }

    const shouldRestoreStock = status === 'Cancelled' && order.status !== 'Cancelled';
    order.status = status;
    if (status === 'Completed') {
      order.paymentStatus = 'Paid';
    }

    await order.save();

    if (shouldRestoreStock) {
      await restoreStock(order.items);
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
