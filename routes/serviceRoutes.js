const express = require('express');
const router = express.Router();
const serviceController = require('../controller/serviceController');

// Public routes (if needed)
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getService);

// Protected routes (add auth middleware later)
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
router.patch('/:id/toggle-status', serviceController.toggleServiceStatus);

module.exports = router;