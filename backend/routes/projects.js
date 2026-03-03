const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all active projects (all authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create project (admin only)
router.post(
  '/',
  [auth, isAdmin, body('name').notEmpty().withMessage('Project name is required'), body('description').optional()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { name, description } = req.body;
      const normalizedName = name.trim();

      const existingProject = await Project.findOne({ name: new RegExp(`^${normalizedName}$`, 'i'), isActive: true });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: 'Project with this name already exists'
        });
      }

      const project = new Project({
        name: normalizedName,
        description: description || '',
        createdBy: req.user._id
      });

      await project.save();
      await project.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        project
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

module.exports = router;
