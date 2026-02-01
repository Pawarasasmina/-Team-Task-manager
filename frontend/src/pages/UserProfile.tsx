import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User } from '../types';

const UserProfile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      if (response.success) {
        setUser(response.user);
        setFormData({
          name: response.user.name,
          contactNumber: response.user.contactNumber,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validate password fields if changing password
      if (isChangingPassword) {
        if (!formData.currentPassword || !formData.newPassword) {
          setMessage({
            type: 'error',
            text: 'Please fill in all password fields'
          });
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({
            type: 'error',
            text: 'New passwords do not match'
          });
          return;
        }

        if (formData.newPassword.length < 6) {
          setMessage({
            type: 'error',
            text: 'Password must be at least 6 characters'
          });
          return;
        }
      }

      setSaving(true);
      setMessage(null);

      const updateData: any = {
        name: formData.name,
        contactNumber: formData.contactNumber
      };

      if (isChangingPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await userService.updateProfile(updateData);
      
      if (response.success) {
        setUser(response.user);
        setIsEditing(false);
        setIsChangingPassword(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setMessage({
          type: 'success',
          text: 'Profile updated successfully!'
        });

        // Update auth context
        if (authUser) {
          updateUser({
            ...authUser,
            name: response.user.name,
            contactNumber: response.user.contactNumber
          });
        }

        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        contactNumber: user.contactNumber,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setIsEditing(false);
    setIsChangingPassword(false);
    setMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="mt-1 text-sm text-gray-600">Manage your personal information</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="flex items-center">
              {message.type === 'success' ? '✓' : '✕'} {message.text}
            </p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-10">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white">{user?.name}</h2>
                <p className="text-indigo-100 mt-1">{user?.email}</p>
                <div className="mt-3 flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                    {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                  {user?.team && typeof user.team === 'object' && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                      👥 {user.team.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Body */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg transition-all"
                    >
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {user?.name}
                      </div>
                    )}
                  </div>

                  {/* Email Field (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed">
                      {user?.email}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Contact Number Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter your contact number"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {user?.contactNumber}
                      </div>
                    )}
                  </div>

                  {/* Role Field (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed capitalize">
                      {user?.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              {isEditing && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
                    <button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        isChangingPassword
                          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                      }`}
                    >
                      {isChangingPassword ? '✕ Cancel Password Change' : '🔒 Change Password'}
                    </button>
                  </div>

                  {isChangingPassword && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50 p-6 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                <span className="font-medium">Member since:</span>{' '}
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div>
                <span className="font-medium">Last updated:</span>{' '}
                {user?.updatedAt && new Date(user.updatedAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
