const express = require('express');
const router = express.Router();
const programController = require('../controller/programController');

// Public routes
router.get('/', programController.getAllPrograms);

// Admin routes
router.get('/admin', programController.getAllProgramsAdmin);
router.get('/admin/:id', programController.getProgramById); 
router.post('/admin', programController.createProgram);
router.put('/admin/:id', programController.updateProgram);
router.delete('/admin/:id', programController.deleteProgram);


module.exports = router;