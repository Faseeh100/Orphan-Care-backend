const Image = require('../models/Image');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// Get all images
exports.getAllImages = async (req, res) => {
  try {
    const images = await Image.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching images',
      error: error.message
    });
  }
};

// Upload image handler
exports.uploadImage = async (req, res) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Use multer middleware directly
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { description, altText, category } = req.body;
      const tempPath = req.file.path;
      const fileExt = path.extname(req.file.originalname);
      
      // Generate unique filename
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExt}`;
      const permanentPath = path.join(uploadsDir, uniqueFilename);
      
      // Move file to permanent location
      await fs.rename(tempPath, permanentPath);
      
      // Create database record
      const image = await Image.create({
        filename: uniqueFilename,
        originalName: req.file.originalname,
        filePath: `/uploads/${uniqueFilename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        description: description || '',
        altText: altText || req.file.originalname,
        category: category || 'general'
      });
      
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: image
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading image',
      error: error.message
    });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the image
    const image = await Image.findByPk(id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', image.filePath);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('File not found or already deleted:', err.message);
    }
    
    // Delete from database
    await image.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting image',
      error: error.message
    });
  }
};