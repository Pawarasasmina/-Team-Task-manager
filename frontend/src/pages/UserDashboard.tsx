import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { Task } from '../types';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<'todo' | 'doing' | 'done' | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          badge: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse',
          icon: '🔴',
          text: 'CRITICAL',
          border: 'border-red-500'
        };
      case 'high':
        return {
          badge: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/40',
          icon: '🟠',
          text: 'HIGH',
          border: 'border-orange-500'
        };
      case 'medium':
        return {
          badge: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30',
          icon: '🔵',
          text: 'MEDIUM',
          border: 'border-blue-500'
        };
      case 'low':
        return {
          badge: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30',
          icon: '🟢',
          text: 'LOW',
          border: 'border-green-500'
        };
      default:
        return {
          badge: 'bg-gray-500 text-white',
          icon: '⚪',
          text: 'NORMAL',
          border: 'border-gray-500'
        };
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskService.getAllTasks();
      setTasks(response.tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, section: 'todo' | 'doing' | 'done') => {
    e.preventDefault();
    setIsDraggingOver(section);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to null if we're leaving the drop zone itself, not its children
    if (e.currentTarget === e.target) {
      setIsDraggingOver(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetSection: 'todo' | 'doing' | 'done') => {
    e.preventDefault();
    setIsDraggingOver(null);
    
    if (draggedTask) {
      // Prevent dropping on same section
      if (draggedTask.status === targetSection) {
        setDraggedTask(null);
        return;
      }
      
      try {
        await taskService.updateTaskStatus(draggedTask._id, targetSection);
        const messages = {
          'todo': '📋 Task moved to To-Do!',
          'doing': '🚀 Task moved to Doing!',
          'done': '✅ Task completed!'
        };
        setSuccess(messages[targetSection]);
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to move task');
        setTimeout(() => setError(''), 3000);
      }
    }
    setDraggedTask(null);
  };

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const doingTasks = tasks.filter(task => task.status === 'doing');
  const doneTasks = tasks.filter(task => task.status === 'done');

  const handleAddTask = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      await taskService.createTask(formData);
      setSuccess('Task added successfully!');
      setShowAddModal(false);
      setFormData({ title: '', description: '' });
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add task');
    }
  };

  const handleEditTask = async () => {
    if (!currentTask || !formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      await taskService.updateTask(currentTask._id, formData);
      setSuccess('Task updated successfully!');
      setShowEditModal(false);
      setCurrentTask(null);
      setFormData({ title: '', description: '' });
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      setSuccess('Task deleted successfully!');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { authService } = await import('../services/authService');
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setFormData({ title: task.title, description: task.description });
    setShowEditModal(true);
    setError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen p-5">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-5">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-6 shadow-xl border border-white/20 flex flex-wrap justify-between items-center gap-4 animate-[slideUp_0.5s_ease]">
        <div>
          <h2 className="text-gray-800 text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-4xl">👋</span>
            <span>Welcome, {user?.name}!</span>
            <span className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase shadow-lg">User</span>
          </h2>
          <p className="text-gray-600 text-sm flex items-center gap-2 mb-2">
            <span className="text-lg">📧</span>
            <span>{user?.email}</span>
          </p>
          <div className="mt-2">
            {user?.team ? (
              typeof user.team === 'object' && 'name' in user.team ? (
                <span className="inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-4 py-2 rounded-full text-xs font-bold shadow-md">
                  🏢 Team: {user.team.name}
                </span>
              ) : (
                <span className="inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-4 py-2 rounded-full text-xs font-bold shadow-md">
                  🏢 Team Assigned
                </span>
              )
            ) : (
              <span className="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-bold shadow-md">
                No Team Assigned
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95 flex items-center gap-2">
            <span>👤</span>
            <span>My Profile</span>
          </button>
          <button onClick={() => setShowPasswordModal(true)} className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-500/40 active:scale-95 flex items-center gap-2">
            <span>🔒</span>
            <span>Change Password</span>
          </button>
          <button onClick={handleLogout} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/50 active:scale-95 flex items-center gap-2">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-5 text-sm shadow-lg animate-[fadeIn_0.3s_ease] flex items-center gap-3"><span className="text-2xl">⚠️</span><span>{error}</span></div>}
      {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-xl mb-5 text-sm shadow-lg animate-[fadeIn_0.3s_ease] flex items-center gap-3"><span className="text-2xl">✅</span><span>{success}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* TO-DO SECTION */}
        <div 
          className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-[fadeIn_0.5s_ease] transition-all duration-300 ${
            isDraggingOver === 'todo'
              ? 'ring-4 ring-gray-500 ring-opacity-50 bg-gray-50 scale-[1.02] shadow-2xl shadow-gray-500/30' 
              : ''
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'todo')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <div className="flex justify-between items-center mb-6">          <div>
              <h3 className="text-gray-800 text-xl font-bold">📋 To Do</h3>
              <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold mt-1">{todoTasks.length} tasks</span>
            </div>
            <button onClick={() => { setFormData({ title: '', description: '' }); setShowAddModal(true); setError(''); }} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40">
              + Add Task
            </button>
          </div>

          {isDraggingOver === 'todo' && (
            <div className="mb-4 bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-dashed border-gray-500 rounded-xl p-6 text-center animate-pulse">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-gray-700 font-bold text-lg">Drop here to move back!</div>
              <div className="text-gray-600 text-sm mt-1">Release to move task</div>
            </div>
          )}

          {todoTasks.length > 0 && !isDraggingOver && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg mb-4 text-sm text-blue-700 flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-medium">Drag tasks anywhere to organize!</span>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {todoTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400"><p>No tasks in To Do section</p></div>
            ) : (
              todoTasks.map(task => {
                const priorityStyle = getPriorityStyle(task.priority || 'medium');
                return (
                <div 
                  key={task._id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`${task.isAssignedByAdmin ? 'bg-gradient-to-br from-[rgba(102,126,234,0.05)] to-[rgba(118,75,162,0.05)]' : 'bg-gray-50'} border-l-4 ${priorityStyle.border} rounded-lg p-4 mb-4 transition-all hover:shadow-lg hover:translate-x-1 cursor-move active:cursor-grabbing relative group`}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200">✊ Drag to Done</span>
                  </div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="font-semibold text-gray-800 text-base flex-1">{task.title}</div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className={`${priorityStyle.badge} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 whitespace-nowrap`}>
                        <span>{priorityStyle.icon}</span>
                        <span>{priorityStyle.text}</span>
                      </span>
                      {task.isAssignedByAdmin && <span className="bg-[#764ba2] text-white px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">👤 Admin</span>}
                    </div>
                  </div>
                  {task.description && <div className="text-gray-600 text-sm mb-3 leading-relaxed">{task.description}</div>}
                  <div className="text-xs text-gray-400 mb-3">📅 Created: {new Date(task.createdAt).toLocaleString()}</div>
                  {!task.isAssignedByAdmin && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEditModal(task)} className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold transition-all hover:bg-blue-600">✏️ Edit</button>
                      <button onClick={() => handleDeleteTask(task._id)} className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold transition-all hover:bg-red-600">🗑️ Delete</button>
                    </div>
                  )}
                </div>
              );})
            )}
          </div>
        </div>

        {/* DOING SECTION */}
        <div 
          className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-[fadeIn_0.5s_ease_0.1s] transition-all duration-300 ${
            isDraggingOver === 'doing'
              ? 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50 scale-[1.02] shadow-2xl shadow-blue-500/30' 
              : ''
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'doing')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'doing')}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-gray-800 text-xl font-bold">🚀 Doing</h3>
              <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold mt-1">{doingTasks.length} in progress</span>
            </div>
          </div>

          {isDraggingOver === 'doing' && (
            <div className="mb-4 bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-dashed border-blue-500 rounded-xl p-6 text-center animate-pulse">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-blue-700 font-bold text-lg">Drop here to start working!</div>
              <div className="text-blue-600 text-sm mt-1">Release to move task</div>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {doingTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-5xl mb-3">⏳</div>
                <p>No tasks in progress</p>
                <p className="text-xs mt-2">Drag tasks from To-Do to start!</p>
              </div>
            ) : (
              doingTasks.map(task => {
                const priorityStyle = getPriorityStyle(task.priority || 'medium');
                return (
                <div 
                  key={task._id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`${task.isAssignedByAdmin ? 'bg-gradient-to-br from-[rgba(102,126,234,0.05)] to-[rgba(118,75,162,0.05)]' : 'bg-blue-50'} border-l-4 ${priorityStyle.border} rounded-lg p-4 mb-4 transition-all hover:shadow-lg hover:translate-x-1 cursor-move active:cursor-grabbing relative group`}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200">✊ Drag to Done</span>
                  </div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="font-semibold text-gray-800 text-base flex-1">{task.title}</div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className={`${priorityStyle.badge} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 whitespace-nowrap`}>
                        <span>{priorityStyle.icon}</span>
                        <span>{priorityStyle.text}</span>
                      </span>
                      {task.isAssignedByAdmin && <span className="bg-[#764ba2] text-white px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">👤 Admin</span>}
                    </div>
                  </div>
                  {task.description && <div className="text-gray-600 text-sm mb-3 leading-relaxed">{task.description}</div>}
                  <div className="text-xs text-gray-400 mb-3">📅 Created: {new Date(task.createdAt).toLocaleString()}</div>
                </div>
              );})
            )}
          </div>
        </div>

        {/* DONE SECTION */}
        <div 
          className={`bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-[fadeIn_0.5s_ease_0.2s] transition-all duration-300 ${
            isDraggingOver === 'done'
              ? 'ring-4 ring-green-500 ring-opacity-50 bg-green-50 scale-[1.02] shadow-2xl shadow-green-500/30' 
              : ''
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'done')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'done')}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-gray-800 text-xl font-bold">✅ Done</h3>
              <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold mt-1">{doneTasks.length} tasks</span>
            </div>
          </div>

          {isDraggingOver === 'done' && (
            <div className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-dashed border-green-500 rounded-xl p-6 text-center animate-pulse">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-green-700 font-bold text-lg">Drop here to complete task!</div>
              <div className="text-green-600 text-sm mt-1">Release to mark as done</div>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {doneTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p>No completed tasks yet</p>
                <p className="text-xs mt-2">Drag from Doing to complete!</p>
              </div>
            ) : (
              doneTasks.map(task => {
                const priorityStyle = getPriorityStyle(task.priority || 'medium');
                return (
                <div 
                  key={task._id} 
                  className={`${task.isAssignedByAdmin ? 'bg-gradient-to-br from-[rgba(102,126,234,0.05)] to-[rgba(118,75,162,0.05)]' : 'bg-gray-50'} border-l-4 ${priorityStyle.border} rounded-lg p-4 mb-4 transition-all hover:shadow-md hover:translate-x-1 opacity-80`}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="font-semibold text-gray-800 text-base flex-1 line-through">{task.title}</div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className={`${priorityStyle.badge} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 whitespace-nowrap opacity-70`}>
                        <span>{priorityStyle.icon}</span>
                        <span>{priorityStyle.text}</span>
                      </span>
                      {task.isAssignedByAdmin && <span className="bg-[#764ba2] text-white px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">👤 Admin</span>}
                    </div>
                  </div>
                  {task.description && <div className="text-gray-600 text-sm mb-3 leading-relaxed">{task.description}</div>}
                  <div className="text-xs text-gray-400">✅ Completed: {new Date(task.updatedAt).toLocaleString()}</div>
                </div>
              );})
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Add New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Task Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter task description (optional)" className="w-full min-h-[100px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm resize-y outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleAddTask} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Add Task</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && currentTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Edit Task</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Task Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter task description (optional)" className="w-full min-h-[100px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm resize-y outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleEditTask} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Update Task</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Current Password *</label>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Enter current password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">New Password *</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="Enter new password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Confirm New Password *</label>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Confirm new password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPasswordModal(false)} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleChangePassword} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Change Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
