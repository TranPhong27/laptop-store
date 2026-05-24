const express = require('express');
const multer = require('multer');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadProductImages } = require('../controllers/uploadController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  },
});

router.post('/products', protect, isAdmin, upload.array('images', 5), uploadProductImages);

module.exports = router;