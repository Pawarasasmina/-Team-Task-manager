# Task Manager - MERN Stack Application

A full-stack task management web application built with MongoDB, Express.js, React (TypeScript), and Node.js.

## Features

### Admin Features
- ✅ Admin login with secure authentication
- ✅ Register new users (name, email, contact number, password)
- ✅ Manage users (view, delete)
- ✅ Assign tasks to specific users
- ✅ View all users and their information

### User Features
- ✅ User login after admin registration
- ✅ Change password after first login
- ✅ **To Do Section**: Add, edit, and delete personal tasks
- ✅ View tasks assigned by admin (cannot edit/delete admin-assigned tasks)
- ✅ **Done Section**: Move completed tasks from To Do to Done
- ✅ Completed tasks are read-only (cannot edit or delete)

## Tech Stack

### Frontend
- React 18
- TypeScript
- React Router v6
- Axios for API calls
- CSS3 with modern styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing

## Project Structure

```
Task manager/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── tasks.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Login.css
    │   │   ├── UserDashboard.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   └── Dashboard.css
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── userService.ts
    │   │   └── taskService.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── index.tsx
    │   └── index.css
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── tsconfig.json
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the repository
```bash
cd "d:\.Port City\Task manager"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env file with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/taskmanager
# JWT_SECRET=your_secure_jwt_secret_key
# NODE_ENV=development

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env file:
# REACT_APP_API_URL=http://localhost:5000/api

# Start the frontend development server
npm start
```

The frontend will run on `http://localhost:3000`

### 4. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service
- Connection string: `mongodb://localhost:27017/taskmanager`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get your connection string
- Update `MONGODB_URI` in backend `.env` file

### 5. Create Admin Account

You need to manually create the first admin account in MongoDB:

```javascript
// Connect to MongoDB using MongoDB Compass or mongosh
// Use database: taskmanager
// Insert into users collection:
{
  "name": "Admin",
  "email": "admin@example.com",
  "contactNumber": "1234567890",
  "password": "$2a$10$YourHashedPasswordHere",  // Use bcrypt to hash your password
  "role": "admin",
  "isPasswordChanged": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

**Or use this script:**

Create a file `backend/createAdmin.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      contactNumber: '1234567890',
      password: hashedPassword,
      role: 'admin',
      isPasswordChanged: true
    });
    
    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run: `node backend/createAdmin.js`

## Usage

### Admin Workflow

1. **Login** with admin credentials at `http://localhost:3000`
2. **Register Users**: Click "Register User" button
   - Enter user's name, email, contact number
   - Set initial password (user can change later)
3. **Assign Tasks**: Click "Assign Task" button
   - Select user from dropdown
   - Enter task title and description
   - Task will appear in user's To Do section
4. **Manage Users**: View all registered users and delete if needed

### User Workflow

1. **Login** with credentials provided by admin
2. **Change Password** (recommended on first login)
3. **To Do Section**:
   - Click "+ Add Task" to create personal tasks
   - Edit/delete your own tasks
   - View admin-assigned tasks (cannot edit/delete)
   - Move tasks to Done section
4. **Done Section**:
   - View all completed tasks
   - Tasks are read-only once marked as done

## API Endpoints

### Authentication
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Users (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users/register` - Register new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/assign` - Assign task to user (Admin)
- `GET /api/tasks/admin/all` - Get all tasks (Admin)

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Protected routes (frontend & backend)
- ✅ Role-based access control
- ✅ Input validation with express-validator
- ✅ CORS configuration
- ✅ Secure HTTP headers

## Default Credentials

After creating admin account:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Change these credentials immediately in production!**

## Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists with correct values
- Check port 5000 is not in use

### Frontend won't start
- Verify backend is running first
- Check `.env` file exists
- Clear npm cache: `npm cache clean --force`

### Can't login
- Verify admin account exists in MongoDB
- Check backend console for errors
- Verify JWT_SECRET is set in backend `.env`

### Tasks not showing
- Check browser console for errors
- Verify token is stored in localStorage
- Check network tab for API responses

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # Hot reload enabled
```

## Production Deployment

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using MERN Stack**
