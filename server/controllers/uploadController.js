const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );

    stream.end(fileBuffer);
  });

exports.uploadProductImages = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ message: 'Cloudinary environment variables are not configured' });
    }

    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: 'No image files uploaded' });
    }

    const uploads = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer, 'products'))
    );

    return res.status(201).json({
      message: 'Images uploaded successfully',
      images: uploads,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};