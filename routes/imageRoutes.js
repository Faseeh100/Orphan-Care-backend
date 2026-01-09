const express = require('express');
const router = express.Router();
const imageController = require('../controller/imageController');

// Get all images
router.get('/', imageController.getAllImages);

// Upload image
router.post('/upload', imageController.uploadImage);

// Delete image
router.delete('/:id', imageController.deleteImage);

module.exports = router;