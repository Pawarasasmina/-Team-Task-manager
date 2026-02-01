const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { auth, isAdmin } = require('../middleware/auth');

// Get all tasks for current user
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Create a new task
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Task title is required'),
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

    const { title, description, priority } = req.body;

    const task = new Task({
      title,
      description: description || '',
      priority: priority || 'medium',
      assignedTo: req.user._id,
      createdBy: req.user._id,
      isAssignedByAdmin: false
    });

    await task.save();
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update a task
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
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

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if task is done
    if (task.status === 'done') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit completed tasks' 
      });
    }

    // Check if user owns the task or is admin
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own tasks' 
      });
    }

    // Users cannot edit admin-assigned tasks
    if (task.isAssignedByAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot edit admin-assigned tasks' 
      });
    }

    const { title, description } = req.body;
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();
    await task.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update task status
router.patch('/:id/status', auth, [
  body('status').isIn(['todo', 'doing', 'done']).withMessage('Status must be todo, doing, or done')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if task belongs to user
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own tasks' 
      });
    }

    task.status = req.body.status;
    await task.save();
    await task.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if task is done
    if (task.status === 'done') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete completed tasks' 
      });
    }

    // Check if user owns the task or is admin
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own tasks' 
      });
    }

    // Users cannot delete admin-assigned tasks
    if (task.isAssignedByAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete admin-assigned tasks' 
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Assign task to user (admin only)
router.post('/assign', [
  auth,
  isAdmin,
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional(),
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

const { title, description, userId, priority } = req.body;

    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const task = new Task({
      title,
      description: description || '',
      priority: priority || 'medium',
      assignedTo: userId,
      createdBy: req.user._id,
      isAssignedByAdmin: true
    });

    await task.save();
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      task
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get all tasks (admin only - for viewing all tasks)
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Admin: Assign task to multiple users (team)
router.post('/assign-team', [
  auth,
  isAdmin,
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('userIds').notEmpty().withMessage('At least one user ID is required'),
  body('title').notEmpty().withMessage('Task title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { title, description, userIds, priority } = req.body;
    const User = require('../models/User');
    
    // Verify all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or more users not found' 
      });
    }

    // Create tasks for all users
    const tasks = await Promise.all(
      userIds.map(async (userId) => {
        const task = new Task({
          title,
          description: description || '',
          priority: priority || 'medium',
          assignedTo: userId,
          createdBy: req.user._id,
          isAssignedByAdmin: true
        });
        await task.save();
        return task;
      })
    );

    res.status(201).json({
      success: true,
      message: `Task assigned successfully to ${tasks.length} user(s)`,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Assign task to team error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get analytics data (admin only)
router.get('/analytics', auth, isAdmin, async (req, res) => {
  try {
    const { period, userId, teamId } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Build query filter
    const filter = { createdAt: { $gte: startDate } };
    
    if (userId) {
      filter.assignedTo = userId;
    }

    if (teamId) {
      const User = require('../models/User');
      const teamUsers = await User.find({ team: teamId }).select('_id');
      filter.assignedTo = { $in: teamUsers.map(u => u._id) };
    }

    // Get all tasks matching filter
    const allTasks = await Task.find(filter).populate('assignedTo', 'name email team');

    // Calculate statistics
    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      doing: allTasks.filter(t => t.status === 'doing').length,
      done: allTasks.filter(t => t.status === 'done').length,
      byPriority: {
        critical: allTasks.filter(t => t.priority === 'critical').length,
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length
      },
      completionRate: allTasks.length > 0 
        ? ((allTasks.filter(t => t.status === 'done').length / allTasks.length) * 100).toFixed(1)
        : 0,
      recentTasks: allTasks.slice(0, 10).map(task => ({
        _id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    };

    // Get user-wise breakdown
    const userStats = {};
    allTasks.forEach(task => {
      const userId = task.assignedTo?._id?.toString();
      if (userId) {
        if (!userStats[userId]) {
          userStats[userId] = {
            user: task.assignedTo,
            total: 0,
            todo: 0,
            doing: 0,
            done: 0
          };
        }
        userStats[userId].total++;
        userStats[userId][task.status]++;
      }
    });

    stats.userBreakdown = Object.values(userStats);

    res.json({
      success: true,
      stats,
      period,
      startDate
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
