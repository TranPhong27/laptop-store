const Product = require('../models/Product');
const mongoose = require('mongoose');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSpecRegex = (value = '') => {
  const escaped = escapeRegex(value.trim());
  const unitMatch = escaped.match(/^(\d+)\\?\s*(GB|TB)$/i);
  if (unitMatch) {
    return `${unitMatch[1]}\\s*${unitMatch[2]}`;
  }

  return escaped.replace(/\\\s+|\s+/g, '\\s*');
};

const createScreenSizeRegex = (value = '') => {
  const normalized = String(value).trim().replace(',', '.');
  const escaped = escapeRegex(normalized);
  return `${escaped.replace(/\\\./g, '[\\.,]')}\\s*(inch|inches|")?`;
};

const parseNonNegativeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return undefined;

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${fieldName} phải là số không âm`);
    error.statusCode = 400;
    throw error;
  }

  return number;
};

const parsePositiveInteger = (value, fallback, max) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return fallback;
  return Math.min(number, max);
};

const normalizeImages = (payload = {}, { preserveMissingImages = false } = {}) => {
  const normalized = { ...payload };
  const hasImageField = Object.prototype.hasOwnProperty.call(normalized, 'image');
  const hasImagesField = Object.prototype.hasOwnProperty.call(normalized, 'images');

  if (preserveMissingImages && !hasImageField && !hasImagesField) {
    return normalized;
  }

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

const buildProductQuery = (query, { includeHidden = false } = {}) => {
  const { search, brand, minPrice, maxPrice, cpu, ram, storage, usage, screenSize, gpuType } = query;
  const filter = includeHidden ? {} : { status: { $ne: 'hidden' } };
  const andFilters = [];

  if (search) {
    const escapedSearch = escapeRegex(search);
    andFilters.push({
      $or: [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { brand: { $regex: escapedSearch, $options: 'i' } },
        { cpu: { $regex: escapedSearch, $options: 'i' } },
        { ram: { $regex: escapedSearch, $options: 'i' } },
        { storage: { $regex: escapedSearch, $options: 'i' } },
        { gpu: { $regex: escapedSearch, $options: 'i' } },
        { screen: { $regex: escapedSearch, $options: 'i' } },
        { usage: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ],
    });
  }

  if (brand) filter.brand = { $regex: `^${escapeRegex(brand)}$`, $options: 'i' };

  const min = parseNonNegativeNumber(minPrice, 'minPrice');
  const max = parseNonNegativeNumber(maxPrice, 'maxPrice');
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  if (cpu) filter.cpu = { $regex: createSpecRegex(cpu), $options: 'i' };
  if (ram) filter.ram = { $regex: createSpecRegex(ram), $options: 'i' };
  if (storage) filter.storage = { $regex: createSpecRegex(storage), $options: 'i' };
  if (screenSize) filter.screen = { $regex: createScreenSizeRegex(screenSize), $options: 'i' };
  if (gpuType === 'dedicated') {
    filter.gpu = { $regex: '^\\s*card\\s+r\u1eddi\\b', $options: 'i' };
  }
  if (gpuType === 'integrated') {
    filter.gpu = { $regex: '^\\s*card\\s+t\u00edch\\s+h\u1ee3p\\b', $options: 'i' };
  }
  if (usage) {
    const usageList = Array.isArray(usage)
      ? usage.map((u) => String(u).trim()).filter(Boolean)
      : String(usage).split(',').map((u) => u.trim()).filter(Boolean);

    if (usageList.length) {
      // Only filter by whether product.usage contains any of the selected values
      filter.usage = { $in: usageList };
    }
  }

  if (andFilters.length) {
    filter.$and = andFilters;
  }

  return filter;
};

const listProducts = async (req, res, options = {}) => {
  try {
    const { sort, page, limit } = req.query;
    const filter = buildProductQuery(req.query, options);
    const sortOptions = {
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      newest: { createdAt: -1 },
      nameAsc: { name: 1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    if (page || limit) {
      const p = parsePositiveInteger(page, 1, 1000000);
      const lim = parsePositiveInteger(limit, 12, 50);
      const total = await Product.countDocuments(filter);
      const pages = Math.max(1, Math.ceil(total / lim));
      const products = await Product.find(filter).sort(sortBy).skip((p - 1) * lim).limit(lim).exec();
      return res.json({ products, page: p, pages, total });
    }

    const products = await Product.find(filter).sort(sortBy).exec();
    return res.json(products);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getProducts = (req, res) => listProducts(req, res);

exports.getAdminProducts = (req, res) => listProducts(req, res, { includeHidden: true });

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.status === 'hidden') {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAdminProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.compareProducts = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (ids.length < 2) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 2 sản phẩm để so sánh' });
    }

    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }

    const products = await Product.find({ _id: { $in: ids }, status: { $ne: 'hidden' } }).exec();
    const byId = new Map(products.map((product) => [String(product._id), product]));
    return res.json(ids.map((id) => byId.get(id)).filter(Boolean));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(normalizeImages(req.body));
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const payload = normalizeImages(req.body, { preserveMissingImages: true });
    const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    return res.json(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    return res.json({ message: 'Sản phẩm đã được xóa' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
