const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// SIMPLER VERSION - No async/await issues
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    
    // Create directory if it doesn't exist (synchronously)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.params.id;
    const uniqueName = `profile_${userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Create multer instance for profile images
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Export the multer middleware
exports.profileUploadMiddleware = profileUpload.single('image');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user.id);
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'created_at']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user.id);
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'ASC']]
    });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// SIMPLE PASSWORD RESET - Updates existing password field
exports.simpleResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔧 Password reset requested for:', email);
    console.log('New password value received:', newPassword ? 'Yes' : 'No');
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      // For security, don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, the password has been updated'
      });
    }

    console.log('✅ User found. Current password hash:', user.password.substring(0, 30) + '...');
    
    // Update the existing password field
    user.password = newPassword; // This will be hashed by the beforeUpdate hook
    await user.save();
    
    console.log('✅ Password updated in database for:', email);
    console.log('New password hash:', user.password.substring(0, 30) + '...');
    
    // Generate new JWT token
    const authToken = generateToken(user.id);
    
    // Return user data
    const userData = user.toJSON();
    delete userData.password;
    
    res.json({
      success: true,
      message: 'Password reset successfully!',
      token: authToken,
      user: userData
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// CHANGE PASSWORD (requires current password) - More secure
exports.changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Find user
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'name', 'email', 'password']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const authToken = generateToken(user.id);
    
    const userData = user.toJSON();
    delete userData.password;
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      token: authToken,
      user: userData
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};



// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, profileImage } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    
    await user.update(updates);
    
    // Return updated user without password
    const updatedUser = user.toJSON();
    delete updatedUser.password;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};



exports.uploadProfileImage = async (req, res) => {
  try {
    console.log('Profile upload request received');
    console.log('File:', req.file);
    console.log('User ID:', req.params.id);

    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided or upload failed'
      });
    }

    console.log('New file:', req.file.filename);
    console.log('Old profile image:', user.profileImage);

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(process.cwd(), 'public', user.profileImage);
      try {
        await fs.unlink(oldImagePath);
        console.log('Deleted old image:', oldImagePath);
      } catch (err) {
        console.warn('Could not delete old image:', err.message);
      }
    }
    
    // Update user with new profile image path
    const relativePath = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = relativePath;
    await user.save();
    
    console.log('Updated user with new image:', relativePath);
    
    // Return updated user (without password)
    const userData = user.toJSON();
    delete userData.password;
    
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      user: userData
    });
    
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile image: ' + error.message
    });
  }
};