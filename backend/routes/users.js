const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('team', 'name').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Register new user (admin only)
router.post('/register', [
  auth,
  isAdmin,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('contactNumber').notEmpty().withMessage('Contact number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, contactNumber, password, team } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      contactNumber,
      password,
      role: 'user',
      team: team || null
    });

    await user.save();

    // If team is assigned, add user to team members
    if (team) {
      const Team = require('../models/Team');
      await Team.findByIdAndUpdate(team, {
        $addToSet: { members: user._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        team: user.team
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update user (admin only)
router.put('/:id', auth, isAdmin, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('contactNumber').optional().notEmpty().withMessage('Contact number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, contactNumber, team } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (team !== undefined) updateData.team = team;

    // Get current user to check old team
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // If team is changing, update team members
    if (team !== undefined && currentUser.team?.toString() !== team) {
      const Team = require('../models/Team');
      
      // Remove from old team
      if (currentUser.team) {
        await Team.findByIdAndUpdate(currentUser.team, {
          $pull: { members: req.params.id }
        });
      }

      // Add to new team
      if (team) {
        await Team.findByIdAndUpdate(team, {
          $addToSet: { members: req.params.id }
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('team', 'name');

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Also delete all tasks associated with this user
    const Task = require('../models/Task');
    await Task.deleteMany({ assignedTo: req.params.id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get own profile (authenticated user)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('team', 'name description');

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
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update own profile (authenticated user)
router.put('/profile', [
  auth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('contactNumber').optional().notEmpty().withMessage('Contact number cannot be empty'),
  body('currentPassword').optional().isLength({ min: 6 }).withMessage('Current password must be at least 6 characters'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, contactNumber, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update basic info
    if (name) user.name = name;
    if (contactNumber) user.contactNumber = contactNumber;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
      user.password = newPassword;
      user.isPasswordChanged = true;
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .select('-password')
      .populate('team', 'name description');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
