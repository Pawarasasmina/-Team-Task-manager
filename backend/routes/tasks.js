const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
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

    const task = await Task.findById(req.params.id).populate('createdBy', 'name email role');

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

    const oldStatus = task.status;
    task.status = req.body.status;
    await task.save();

    // If task is marked as done, notify all admins
    if (req.body.status === 'done' && oldStatus !== 'done') {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      
      console.log(`📢 Task "${task.title}" completed by ${req.user.name}, notifying ${admins.length} admin(s)`);
      
      for (const admin of admins) {
        // Skip sending notification to the user who completed the task if they are also an admin
        if (admin._id.toString() === req.user._id.toString()) {
          console.log(`⏭️  Skipping notification to self (admin who completed task)`);
          continue;
        }

        const notification = new Notification({
          recipient: admin._id,
          sender: req.user._id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${req.user.name} has completed the task: "${task.title}"`,
          task: task._id
        });
        await notification.save();
        console.log(`💾 Notification saved to DB for admin ${admin.name}`);
        
        // Send real-time notification via Socket.IO
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const adminSocketId = connectedUsers.get(admin._id.toString());
        
        if (adminSocketId) {
          const notificationPayload = {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            sender: { name: req.user.name },
            task: { title: task.title },
            createdAt: notification.createdAt,
            isRead: false
          };
          io.to(adminSocketId).emit('notification', notificationPayload);
          console.log(`📡 Real-time notification emitted to admin ${admin.name} (socket: ${adminSocketId})`);
        } else {
          console.log(`⚠️  Admin ${admin.name} is not connected (no active socket)`);
        }
      }
    }

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

    console.log(`📢 Task "${title}" assigned to ${user.name} by admin ${req.user.name}`);

    // Create notification for assigned user
    const notification = new Notification({
      recipient: userId,
      sender: req.user._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${title}"`,
      task: task._id
    });
    await notification.save();
    console.log(`💾 Notification saved to DB for user ${user.name}`);

    // Send real-time notification via Socket.IO
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const userSocketId = connectedUsers.get(userId.toString());
    
    if (userSocketId) {
      const notificationPayload = {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: { name: req.user.name },
        task: { title: task.title },
        createdAt: notification.createdAt,
        isRead: false
      };
      io.to(userSocketId).emit('notification', notificationPayload);
      console.log(`📡 Real-time notification emitted to user ${user.name} (socket: ${userSocketId})`);
    } else {
      console.log(`⚠️  User ${user.name} is not connected (no active socket)`);
    }

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
        
        // Create notification for each assigned user
        const notification = new Notification({
          recipient: userId,
          sender: req.user._id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${title}"`,
          task: task._id
        });
        await notification.save();

        // Send real-time notification via Socket.IO
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const userSocketId = connectedUsers.get(userId.toString());
        
        if (userSocketId) {
          io.to(userSocketId).emit('notification', {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            sender: { name: req.user.name },
            task: { title: task.title },
            createdAt: notification.createdAt,
            isRead: false
          });
        }
        
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

module.exports = router;
