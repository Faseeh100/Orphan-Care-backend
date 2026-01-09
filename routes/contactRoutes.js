// server/routes/contactRoutes.js
const express = require('express');
const router = express.Router(); // Use Express Router
const contactController = require('../controller/contactController');

// POST /api/contact/submit
router.post('/submit', contactController.submitContactForm);

// GET /api/contact/admin
router.get('/admin', contactController.getAllContacts);

module.exports = router;