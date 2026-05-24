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