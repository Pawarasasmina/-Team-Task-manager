const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envName) => !process.env[envName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
};

// Configure Socket.IO with proper CORS and settings
const io = socketIO(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      console.log(`📊 Total connected users: ${connectedUsers.size}`);
    } else {
      console.log('⚠️  User registration attempted without userId');
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        console.log(`📊 Total connected users: ${connectedUsers.size}`);
        break;
      }
    }
    if (!disconnectedUserId) {
      console.log(`🔌 Unregistered socket ${socket.id} disconnected`);
    }
  });
});

// Store connected users map for routes to access
app.set('connectedUsers', connectedUsers);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const notificationRoutes = require('./routes/notifications');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔌 Socket.IO is ready`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
