import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { teamService } from '../services/teamService';
import { User, Team } from '../types';
import AdminTasksSummary from '../components/AdminTasksSummary';import NotificationBell from '../components/NotificationBell';
const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'tasks'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', contactNumber: '', password: '', team: '' });
  const [editUserData, setEditUserData] = useState({ name: '', email: '', contactNumber: '', team: '' });
  const [assignData, setAssignData] = useState({ userId: '', teamId: '', title: '', description: '', priority: 'medium' });
  const [teamData, setTeamData] = useState({ name: '', description: '', members: [] as string[] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllDoneTasks, setShowAllDoneTasks] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchAllTasks();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAllTeams();
      setTeams(response.teams);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await taskService.getAllTasksAdmin();
      setAllTasks(response.tasks || []);
    } catch (err) {
      console.error('Error fetching all tasks:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      const mappedUsers = response.users
        .filter((u: any) => u.role !== 'admin')
        .map((u: any) => ({ ...u, id: u._id }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async () => {
    if (!formData.name || !formData.email || !formData.contactNumber || !formData.password) {
      setError('All fields are required');
      return;
    }

    try {
      await userService.registerUser(formData);
      setSuccess('User registered successfully!');
      setShowRegisterModal(false);
      setFormData({ name: '', email: '', contactNumber: '', password: '', team: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? All their tasks will also be deleted.')) return;

    try {
      await userService.deleteUser(userId);
      setSuccess('User deleted successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    const teamId = user.team ? (typeof user.team === 'string' ? user.team : user.team._id) : '';
    setEditUserData({ 
      name: user.name, 
      email: user.email, 
      contactNumber: user.contactNumber, 
      team: teamId 
    });
    setShowEditUserModal(true);
    setError('');
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editUserData.name || !editUserData.email || !editUserData.contactNumber) {
      setError('Name, email, and contact number are required');
      return;
    }

    try {
      await userService.updateUser(editingUser.id, {
        name: editUserData.name,
        email: editUserData.email,
        contactNumber: editUserData.contactNumber,
        team: editUserData.team || null
      });
      setSuccess('User updated successfully!');
      setShowEditUserModal(false);
      setEditingUser(null);
      setEditUserData({ name: '', email: '', contactNumber: '', team: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleAssignTask = async () => {
    if ((!assignData.userId && !assignData.teamId) || !assignData.title) {
      setError('Please select a user or team, and provide a task title');
      return;
    }

    if (assignData.userId && assignData.teamId) {
      setError('Please select either a user or a team, not both');
      return;
    }

    try {
      if (assignData.teamId) {
        // Find all users in the selected team
        const selectedTeam = teams.find(t => t._id === assignData.teamId);
        if (!selectedTeam || !selectedTeam.members || selectedTeam.members.length === 0) {
          setError('Selected team has no members');
          return;
        }
        
        // Get member IDs
        const memberIds = selectedTeam.members.map((m: any) => typeof m === 'string' ? m : m._id || m.id);
        
        // Assign task to all team members
        await taskService.assignTaskToTeam({
          teamId: assignData.teamId,
          userIds: memberIds,
          title: assignData.title,
          description: assignData.description,
          priority: assignData.priority
        });
        setSuccess(`Task assigned successfully to ${memberIds.length} team member(s)!`);
      } else {
        // Assign to single user
        await taskService.assignTask({
          userId: assignData.userId,
          title: assignData.title,
          description: assignData.description,
          priority: assignData.priority
        });
        setSuccess('Task assigned successfully!');
      }
      
      setShowAssignModal(false);
      setAssignData({ userId: '', teamId: '', title: '', description: '', priority: 'medium' });
      fetchAllTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleCreateOrUpdateTeam = async () => {
    if (!teamData.name) {
      setError('Team name is required');
      return;
    }

    try {
      if (editingTeam) {
        await teamService.updateTeam(editingTeam._id, { name: teamData.name, description: teamData.description });
        
        // Handle member changes
        const currentMembers = Array.isArray(editingTeam.members) 
          ? editingTeam.members.map((m: any) => typeof m === 'string' ? m : m._id || m.id)
          : [];
        const newMembers = teamData.members;
        
        // Add new members
        const membersToAdd = newMembers.filter(m => !currentMembers.includes(m));
        if (membersToAdd.length > 0) {
          await teamService.addMembersToTeam(editingTeam._id, membersToAdd);
        }
        
        // Remove members
        const membersToRemove = currentMembers.filter((m: string) => !newMembers.includes(m));
        for (const memberId of membersToRemove) {
          await teamService.removeMemberFromTeam(editingTeam._id, memberId);
        }
        
        setSuccess('Team updated successfully!');
      } else {
        const response = await teamService.createTeam({ name: teamData.name, description: teamData.description });
        // Add members to newly created team
        if (teamData.members.length > 0 && response.team) {
          await teamService.addMembersToTeam(response.team._id, teamData.members);
        }
        setSuccess('Team created successfully!');
      }
      setShowTeamModal(false);
      setTeamData({ name: '', description: '', members: [] });
      setEditingTeam(null);
      fetchTeams();
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? Users in this team will no longer be associated with any team.')) return;

    try {
      await teamService.deleteTeam(teamId);
      setSuccess('Team deleted successfully!');
      fetchTeams();
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete team');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    const memberIds = Array.isArray(team.members) 
      ? team.members.map((m: any) => typeof m === 'string' ? m : m._id || m.id)
      : [];
    setTeamData({ name: team.name, description: team.description, members: memberIds });
    setShowTeamModal(true);
    setError('');
  };

  const getTeamName = (user: User) => {
    if (!user.team) return 'No Team';
    if (typeof user.team === 'string') {
      const team = teams.find(t => t._id === user.team);
      return team?.name || 'No Team';
    }
    return user.team.name || 'No Team';
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          badge: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/40',
          icon: '🔴',
          text: 'CRITICAL',
          bgClass: 'bg-red-50',
          borderClass: 'border-red-500'
        };
      case 'high':
        return {
          badge: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30',
          icon: '🟠',
          text: 'HIGH',
          bgClass: 'bg-orange-50',
          borderClass: 'border-orange-500'
        };
      case 'medium':
        return {
          badge: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20',
          icon: '🔵',
          text: 'MEDIUM',
          bgClass: 'bg-blue-50',
          borderClass: 'border-blue-500'
        };
      case 'low':
        return {
          badge: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/20',
          icon: '🟢',
          text: 'LOW',
          bgClass: 'bg-green-50',
          borderClass: 'border-green-500'
        };
      default:
        return {
          badge: 'bg-gray-500 text-white',
          icon: '⚪',
          text: 'NORMAL',
          bgClass: 'bg-gray-50',
          borderClass: 'border-gray-500'
        };
    }
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
            <span className="text-4xl">🎯</span>
            <span>Admin Dashboard</span>
            <span className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase shadow-lg">Admin</span>
          </h2>
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <span className="text-lg">👤</span>
            <span>{user?.email}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <NotificationBell />
          <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold transition-all hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95">
            <span className="flex items-center gap-2">
              <span>👤</span>
              <span>My Profile</span>
            </span>
          </button>
          <button onClick={handleLogout} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold transition-all hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/50 active:scale-95">
            <span className="flex items-center gap-2">
              <span>🚪</span>
              <span>Logout</span>
            </span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-5 text-sm shadow-lg animate-[fadeIn_0.3s_ease] flex items-center gap-3"><span className="text-2xl">⚠️</span><span>{error}</span></div>}
      {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-xl mb-5 text-sm shadow-lg animate-[fadeIn_0.3s_ease] flex items-center gap-3"><span className="text-2xl">✅</span><span>{success}</span></div>}

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-3 shadow-xl mb-6 border border-white/20">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-2xl shadow-primary/40 scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-102 hover:shadow-lg'
            }`}
          >
            <span className="text-xl">👥</span>
            <span>Users</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'teams'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-2xl shadow-primary/40 scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-102 hover:shadow-lg'
            }`}
          >
            <span className="text-xl">🏢</span>
            <span>Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 min-w-[150px] px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-2xl shadow-primary/40 scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-102 hover:shadow-lg'
            }`}
          >
            <span className="text-xl">📋</span>
            <span>Tasks</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-gray-800 text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">👥</span>
              <span>User Management</span>
            </h3>
            <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold mt-2 shadow-md">{users.length} users registered</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => { setFormData({ name: '', email: '', contactNumber: '', password: '', team: '' }); setShowRegisterModal(true); setError(''); }} className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 flex items-center gap-2">
              <span className="text-lg">➕</span>
              <span>Register User</span>
            </button>
            <button onClick={() => { setAssignData({ userId: '', teamId: '', title: '', description: '', priority: 'medium' }); setShowAssignModal(true); setError(''); }} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/40 active:scale-95 flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span>Assign Task</span>
            </button>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {users.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-6xl mb-4">👤</p>
              <p className="text-lg font-semibold">No users registered yet</p>
              <p className="text-sm mt-2">Click "Register User" to add your first user</p>
            </div>
          ) : (
            <div className="grid gap-4">
            {(showAllUsers ? users : users.slice(0, 5)).map(u => (
              <div key={u.id} className="bg-gradient-to-r from-white to-gray-50 border-l-4 border-[#667eea] rounded-2xl p-6 transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-l-8 group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      <span>{u.name}</span>
                    </div>
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      🏢 {getTeamName(u)}
                    </span>
                  </div>
                </div>
                <div className="text-gray-600 text-sm mb-3 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📧</span>
                    <span>{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span>{u.contactNumber}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  <span>Registered: {new Date(u.createdAt || '').toLocaleString()}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => openEditUser(u)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDeleteUser(u.id)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40 active:scale-95 flex items-center gap-1.5">
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
          
          {/* See More Button for Users */}
          {users.length > 5 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAllUsers(!showAllUsers)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95 flex items-center gap-2 mx-auto"
              >
                <span>{showAllUsers ? '👆' : '👇'}</span>
                <span>{showAllUsers ? 'Show Less' : `See More (${users.length - 5} more)`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'teams' && (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-gray-800 text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🏢</span>
              <span>Team Management</span>
            </h3>
            <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold mt-2 shadow-md">{teams.length} teams created</span>
          </div>
          <button 
            onClick={() => { setTeamData({ name: '', description: '', members: [] }); setEditingTeam(null); setShowTeamModal(true); setError(''); }} 
            className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            <span>Create Team</span>
          </button>
        </div>

        <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {teams.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-6xl mb-4">🏢</p>
              <p className="text-lg font-semibold">No teams created yet</p>
              <p className="text-sm mt-2">Click "Create Team" to add your first team</p>
            </div>
          ) : (
            <div className="grid gap-4">
            {teams.map(team => {
              const memberUsers = Array.isArray(team.members) 
                ? team.members.map((m: any) => {
                    if (typeof m === 'string') {
                      const user = users.find(u => u.id === m);
                      return user?.name || 'Unknown';
                    }
                    return m.name || 'Unknown';
                  })
                : [];
              
              return (
              <div key={team._id} className="bg-gradient-to-r from-white to-purple-50 border-l-4 border-[#764ba2] rounded-2xl p-6 transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-l-8">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                      <span className="text-2xl">🏢</span>
                      <span>{team.name}</span>
                    </div>
                    <div className="text-gray-600 text-sm mt-2">{team.description || 'No description provided'}</div>
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-3 mb-3">
                  <div className="text-xs text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span>👥</span>
                    <span>{memberUsers.length} Member{memberUsers.length !== 1 ? 's' : ''}</span>
                  </div>
                  {memberUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {memberUsers.map((name, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  <span>Created: {new Date(team.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => openEditTeam(team)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 flex items-center gap-1.5">
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDeleteTeam(team._id)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40 active:scale-95 flex items-center gap-1.5">
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'tasks' && (
        <AdminTasksSummary
          allTasks={allTasks}
          users={users}
          teams={teams}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTeamFilter={selectedTeamFilter}
          setSelectedTeamFilter={setSelectedTeamFilter}
          getTeamName={getTeamName}
          getPriorityStyle={getPriorityStyle}
          showAllDoneTasks={showAllDoneTasks}
          setShowAllDoneTasks={setShowAllDoneTasks}
        />
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowRegisterModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Register New User</h3>
              <button onClick={() => setShowRegisterModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Contact Number *</label>
                <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} placeholder="Enter contact number" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Password *</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter initial password" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Team (Optional)</label>
                <select 
                  value={formData.team} 
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
                >
                  <option value="">No Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRegisterModal(false)} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleRegisterUser} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Register User</button>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Edit User</h3>
              <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Full Name *</label>
                <input type="text" value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} placeholder="Enter full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Email *</label>
                <input type="email" value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} placeholder="Enter email address" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Contact Number *</label>
                <input type="text" value={editUserData.contactNumber} onChange={(e) => setEditUserData({ ...editUserData, contactNumber: e.target.value })} placeholder="Enter contact number" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Team (Optional)</label>
                <select 
                  value={editUserData.team} 
                  onChange={(e) => setEditUserData({ ...editUserData, team: e.target.value })} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
                >
                  <option value="">No Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleUpdateUser} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Update User</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">Assign Task</h3>
              <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              
             

              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Select User</label>
                <select 
                  value={assignData.userId} 
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value, teamId: '' })} 
                  disabled={!!assignData.teamId}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="mb-5 text-center">
                <span className="inline-block px-4 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">OR</span>
              </div>

              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Select Team</label>
                <select 
                  value={assignData.teamId} 
                  onChange={(e) => setAssignData({ ...assignData, teamId: e.target.value, userId: '' })} 
                  disabled={!!assignData.userId}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Choose a team...</option>
                  {teams.map(team => {
                    const memberCount = team.members ? (Array.isArray(team.members) ? team.members.length : 0) : 0;
                    return (
                      <option key={team._id} value={team._id}>
                        {team.name} ({memberCount} member{memberCount !== 1 ? 's' : ''})
                      </option>
                    );
                  })}
                </select>
                {assignData.teamId && (() => {
                  const selectedTeam = teams.find(t => t._id === assignData.teamId);
                  const memberCount = selectedTeam?.members ? (Array.isArray(selectedTeam.members) ? selectedTeam.members.length : 0) : 0;
                  return memberCount > 0 ? (
                    <p className="text-xs text-green-600 mt-1">✓ Task will be assigned to {memberCount} team member{memberCount !== 1 ? 's' : ''}</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">⚠ This team has no members</p>
                  );
                })()}
              </div>

              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Task Title *</label>
                <input type="text" value={assignData.title} onChange={(e) => setAssignData({ ...assignData, title: e.target.value })} placeholder="Enter task title" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Description</label>
                <textarea value={assignData.description} onChange={(e) => setAssignData({ ...assignData, description: e.target.value })} placeholder="Enter task description (optional)" className="w-full min-h-[100px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm resize-y outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" />
              </div>

              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Priority Level *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignData({ ...assignData, priority: 'low' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      assignData.priority === 'low'
                        ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🟢</span>
                      <div className="text-left">
                        <div className="font-bold text-green-700 text-sm">Low</div>
                        <div className="text-xs text-green-600">Not urgent</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignData({ ...assignData, priority: 'medium' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      assignData.priority === 'medium'
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔵</span>
                      <div className="text-left">
                        <div className="font-bold text-blue-700 text-sm">Medium</div>
                        <div className="text-xs text-blue-600">Normal task</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignData({ ...assignData, priority: 'high' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      assignData.priority === 'high'
                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🟠</span>
                      <div className="text-left">
                        <div className="font-bold text-orange-700 text-sm">High</div>
                        <div className="text-xs text-orange-600">Important</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignData({ ...assignData, priority: 'critical' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      assignData.priority === 'critical'
                        ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/20 ring-2 ring-red-300 animate-pulse'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔴</span>
                      <div className="text-left">
                        <div className="font-bold text-red-700 text-sm">Critical</div>
                        <div className="text-xs text-red-600">Urgent!</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAssignModal(false)} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleAssignTask} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" onClick={() => { setShowTeamModal(false); setEditingTeam(null); }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 text-2xl font-bold">{editingTeam ? 'Edit Team' : 'Create New Team'}</h3>
              <button onClick={() => { setShowTeamModal(false); setEditingTeam(null); }} className="w-8 h-8 flex items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-800">×</button>
            </div>
            <div className="mb-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm border-l-4 border-red-600">{error}</div>}
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Team Name *</label>
                <input 
                  type="text" 
                  value={teamData.name} 
                  onChange={(e) => setTeamData({ ...teamData, name: e.target.value })} 
                  placeholder="Enter team name" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" 
                />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Description (Optional)</label>
                <textarea 
                  value={teamData.description} 
                  onChange={(e) => setTeamData({ ...teamData, description: e.target.value })} 
                  placeholder="Enter team description" 
                  className="w-full min-h-[100px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm resize-y outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]" 
                />
              </div>
              <div className="mb-5">
                <label className="block text-gray-800 mb-2 font-medium text-sm">Team Members (Optional)</label>
                <div className="border-2 border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-gray-400 text-sm">No users available</p>
                  ) : (
                    users.map(u => (
                      <label key={u.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={teamData.members.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTeamData({ ...teamData, members: [...teamData.members, u.id] });
                            } else {
                              setTeamData({ ...teamData, members: teamData.members.filter(id => id !== u.id) });
                            }
                          }}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{u.name} ({u.email})</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{teamData.members.length} member(s) selected</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowTeamModal(false); setEditingTeam(null); }} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
              <button onClick={handleCreateOrUpdateTeam} className="px-5 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg">
                {editingTeam ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
