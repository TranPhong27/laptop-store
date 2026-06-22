const mongoose = require('mongoose');

const imageField = {
  type: String,
  trim: true,
  match: [/^https?:\/\/.+/i, 'Ảnh phải là một URL hợp lệ'],
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
      minlength: [2, 'Tên sản phẩm phải có ít nhất 2 ký tự'],
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá sản phẩm'],
      min: [0, 'Giá sản phẩm không được âm'],
    },
    brand: { type: String, trim: true },
    cpu: { type: String, trim: true },
    ram: { type: String, trim: true },
    storage: { type: String, trim: true },
    gpu: { type: String, trim: true },
    screen: { type: String, trim: true },
    warranty: { type: String, trim: true },
    stock: { type: Number, default: 0, min: [0, 'Tồn kho không được âm'] },
    condition: {
      type: String,
      enum: ['new', 'likeNew', 'used'],
      default: 'new',
    },
    originalPrice: {
      type: Number,
      min: [0, 'Giá gốc không được âm'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Giảm giá không được âm'],
      max: [100, 'Giảm giá không được vượt quá 100%'],
    },
    usage: {
      type: [String],
      enum: ['student', 'office', 'gaming', 'design', 'premium'],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'outOfStock'],
      default: 'active',
    },
    image: imageField,
    images: [imageField],
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

productSchema.pre('validate', function () {
  const hasPrimaryImage = Boolean(this.image);
  const hasGalleryImages = Array.isArray(this.images) && this.images.length > 0;

  if (!hasPrimaryImage && !hasGalleryImages) {
    this.invalidate('images', 'Sản phẩm phải có ít nhất một ảnh');
  }
});

module.exports = mongoose.model('Product', productSchema);
