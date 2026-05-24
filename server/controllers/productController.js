const Product = require('../models/Product');

const normalizeImages = (payload = {}) => {
  const normalized = { ...payload };
  const image = typeof normalized.image === 'string' ? normalized.image.trim() : '';
  const rawImages = Array.isArray(normalized.images) ? normalized.images : [];
  const images = rawImages
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);

  if (image && !images.includes(image)) {
    images.unshift(image);
  }

  normalized.images = images;
  normalized.image = images[0] || image || '';

  return normalized;
};

exports.getProducts = async (req, res) => {
  try {
    const { search, brand, minPrice, maxPrice, page, limit } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);

    if (page || limit) {
      const p = Number(page) > 0 ? Number(page) : 1;
      const lim = Number(limit) > 0 ? Number(limit) : 12;
      const total = await Product.countDocuments(filter);
      const pages = Math.max(1, Math.ceil(total / lim));
      const products = await Product.find(filter).skip((p - 1) * lim).limit(lim).exec();
      return res.json({ products, page: p, pages, total });
    }

    const products = await Product.find(filter).exec();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(normalizeImages(req.body));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, normalizeImages(req.body), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};