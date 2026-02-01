const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Get all teams (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const teams = await Team.find().populate('members', 'name email').sort({ createdAt: -1 });
    res.json({
      success: true,
      teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Create new team (admin only)
router.post('/', [
  auth,
  isAdmin,
  body('name').notEmpty().withMessage('Team name is required'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;

    // Check if team already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team with this name already exists' 
      });
    }

    const team = new Team({
      name,
      description: description || '',
      members: []
    });

    await team.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update team (admin only)
router.put('/:id', [
  auth,
  isAdmin,
  body('name').optional().notEmpty().withMessage('Team name cannot be empty'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('members', 'name email');

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    res.json({
      success: true,
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete team (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Remove team reference from users
    await User.updateMany({ team: req.params.id }, { team: null });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Add users to team (admin only)
router.post('/:id/members', [
  auth,
  isAdmin,
  body('userIds').isArray().withMessage('User IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { userIds } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Add users to team and update user documents
    for (const userId of userIds) {
      if (!team.members.includes(userId)) {
        team.members.push(userId);
        await User.findByIdAndUpdate(userId, { team: req.params.id });
      }
    }

    await team.save();
    await team.populate('members', 'name email');

    res.json({
      success: true,
      message: 'Users added to team successfully',
      team
    });
  } catch (error) {
    console.error('Add team members error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Remove user from team (admin only)
router.delete('/:id/members/:userId', auth, isAdmin, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    team.members = team.members.filter(member => member.toString() !== req.params.userId);
    await team.save();
    await User.findByIdAndUpdate(req.params.userId, { team: null });

    res.json({
      success: true,
      message: 'User removed from team successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
