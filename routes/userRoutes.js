const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// ✅ PUBLIC ROUTES - Specific routes FIRST
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/simple-reset-password', userController.simpleResetPassword);
router.post('/change-password', userController.changePassword);

// ✅ SPECIFIC ROUTE BEFORE PARAMETERIZED
router.get('/all', userController.getAllUsers);
router.get('/me', userController.getCurrentUser);

// ✅ PARAMETERIZED ROUTES LAST
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// ✅ PROFILE IMAGE UPLOAD ROUTE (Using multer middleware)
router.post(
  '/:id/profile-image',
  userController.profileUploadMiddleware, // Multer middleware
  userController.uploadProfileImage       // Controller function
);

module.exports = router;