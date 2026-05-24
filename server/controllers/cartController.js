const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    return res.json(cart ? cart.items : []);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const existing = cart.items.find((it) => it.productId.equals(productId));
    if (existing) {
      existing.quantity = existing.quantity + qty;
    } else {
      cart.items.push({ productId, name: product.name, price: product.price, quantity: qty });
    }

    await cart.save();
    return res.json(cart.items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ message: 'quantity must be a non-negative number' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((it) => it.productId.equals(productId));
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in cart' });

    if (qty === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = qty;
    }

    await cart.save();
    return res.json(cart.items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((it) => !it.productId.equals(productId));
    await cart.save();
    return res.json(cart.items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};