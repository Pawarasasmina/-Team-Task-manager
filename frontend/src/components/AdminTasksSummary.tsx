import React from 'react';
import { User } from '../types';

interface AdminTasksSummaryProps {
  allTasks: any[];
  users: User[];
  teams: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTeamFilter: string;
  setSelectedTeamFilter: (filter: string) => void;
  getTeamName: (user: User) => string;
  getPriorityStyle: (priority: string) => any;
  showAllDoneTasks: boolean;
  setShowAllDoneTasks: (show: boolean) => void;
}

const AdminTasksSummary: React.FC<AdminTasksSummaryProps> = ({
  allTasks,
  users,
  teams,
  searchQuery,
  setSearchQuery,
  selectedTeamFilter,
  setSelectedTeamFilter,
  getTeamName,
  getPriorityStyle,
  showAllDoneTasks,
  setShowAllDoneTasks
}) => {
  const [expandedUsers, setExpandedUsers] = React.useState<Set<string>>(new Set());

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
      {/* Compact Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Tasks Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl">📋</div>
            <div className="text-2xl font-bold">{allTasks.length}</div>
          </div>
          <div className="text-purple-100 text-xs font-medium">All Tasks</div>
        </div>

        {/* To-Do Tasks Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl">📝</div>
            <div className="text-2xl font-bold">{allTasks.filter(t => t.status === 'todo').length}</div>
          </div>
          <div className="text-blue-100 text-xs font-medium">To-Do</div>
        </div>

        {/* Doing Tasks Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl">🚀</div>
            <div className="text-2xl font-bold">{allTasks.filter(t => t.status === 'doing').length}</div>
          </div>
          <div className="text-orange-100 text-xs font-medium">In Progress</div>
        </div>

        {/* Done Tasks Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-2xl">✅</div>
            <div className="text-2xl font-bold">{allTasks.filter(t => t.status === 'done').length}</div>
          </div>
          <div className="text-green-100 text-xs font-medium">Completed</div>
        </div>
      </div>

      {/* Minimalistic Users & Done Tasks Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-gray-800 text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Users & Completed Tasks</span>
            </h3>
          </div>
          <div className="text-xs font-semibold text-green-600">
            {allTasks.filter(t => t.status === 'done').length} Total Done
          </div>
        </div>

        {/* Minimalistic List */}
        <div className="space-y-1.5">
          {users
            .filter(u => {
              const matchesSearch = searchQuery.trim() === '' || 
                u.name.toLowerCase().includes(searchQuery.toLowerCase());
              
              let matchesTeam = true;
              if (selectedTeamFilter) {
                if (selectedTeamFilter === 'no-team') {
                  matchesTeam = !u.team;
                } else {
                  const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                  matchesTeam = userTeamId === selectedTeamFilter;
                }
              }
              
              return matchesSearch && matchesTeam;
            })
            .slice(0, showAllDoneTasks ? undefined : 5)
            .map((u) => {
              const userTasks = allTasks.filter(t => 
                (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id) === u.id
              );
              
              const doneTasks = userTasks.filter(t => t.status === 'done');
              const isExpanded = expandedUsers.has(u.id);
              const displayedTasks = isExpanded ? doneTasks : doneTasks.slice(0, 5);
              
              return (
                <div key={u.id} className="bg-white border border-gray-200 rounded-lg hover:border-green-400 transition-all">
                  {/* User Row - Minimal */}
                  <div className="flex items-center justify-between px-3 py-2 bg-green-50/30">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm truncate">{u.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-bold text-xs">
                        {doneTasks.length} done
                      </span>
                    </div>
                  </div>
                  
                  {/* Task List - Always Visible */}
                  {doneTasks.length > 0 && (
                    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
                      <div className="space-y-1">
                        {displayedTasks.map((task, index) => (
                          <div key={task._id} className="flex items-center gap-2 text-xs py-1">
                            <span className="text-green-600 font-bold w-4 flex-shrink-0">{index + 1}.</span>
                            <span className="text-gray-700 line-through flex-1 truncate">{task.title}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* See More Button for Individual User */}
                      {doneTasks.length > 5 && (
                        <div className="mt-3 text-center">
                          <button
                            onClick={() => toggleUserExpanded(u.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30 active:scale-95 flex items-center gap-1.5 mx-auto"
                          >
                            <span>{isExpanded ? '👆' : '👇'}</span>
                            <span>{isExpanded ? 'Show Less' : `See ${doneTasks.length - 5} More`}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          
          {users.filter(u => {
            const matchesSearch = searchQuery.trim() === '' || 
              u.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesTeam = true;
            if (selectedTeamFilter) {
              if (selectedTeamFilter === 'no-team') {
                matchesTeam = !u.team;
              } else {
                const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                matchesTeam = userTeamId === selectedTeamFilter;
              }
            }
            
            return matchesSearch && matchesTeam;
          }).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-6xl mb-3">👥</p>
              <p className="text-lg font-semibold">No users found</p>
              <p className="text-sm mt-2">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
        
        {/* See More Button for Done Tasks */}
        {users.filter(u => {
          const matchesSearch = searchQuery.trim() === '' || 
            u.name.toLowerCase().includes(searchQuery.toLowerCase());
          
          let matchesTeam = true;
          if (selectedTeamFilter) {
            if (selectedTeamFilter === 'no-team') {
              matchesTeam = !u.team;
            } else {
              const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
              matchesTeam = userTeamId === selectedTeamFilter;
            }
          }
          
          return matchesSearch && matchesTeam;
        }).length > 5 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAllDoneTasks(!showAllDoneTasks)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 flex items-center gap-2 mx-auto"
            >
              <span>{showAllDoneTasks ? '👆' : '👇'}</span>
              <span>{showAllDoneTasks ? 'Show Less' : `See More (${users.filter(u => {
                const matchesSearch = searchQuery.trim() === '' || 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase());
                
                let matchesTeam = true;
                if (selectedTeamFilter) {
                  if (selectedTeamFilter === 'no-team') {
                    matchesTeam = !u.team;
                  } else {
                    const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                    matchesTeam = userTeamId === selectedTeamFilter;
                  }
                }
                
                return matchesSearch && matchesTeam;
              }).length - 5} more)`}</span>
            </button>
          </div>
        )}
      </div>

      {/* User Performance Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-gray-800 text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">📊</span>
              <span>User Performance Summary</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Quick overview of all users and their task completion</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-2">🔍 Search by User Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type user name..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-2">🏢 Filter by Team</label>
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] transition-all"
            >
              <option value="">All Teams ({users.length} users)</option>
              {teams.map(team => {
                const teamUserCount = users.filter(u => {
                  const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                  return userTeamId === team._id;
                }).length;
                return (
                  <option key={team._id} value={team._id}>{team.name} ({teamUserCount} users)</option>
                );
              })}
              <option value="no-team">Users Without Team ({users.filter(u => !u.team).length})</option>
            </select>
          </div>
        </div>

        {/* Compact User Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">📝 To-Do</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">🚀 Doing</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">✅ Done</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(u => {
                const matchesSearch = searchQuery.trim() === '' || 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase());
                
                let matchesTeam = true;
                if (selectedTeamFilter) {
                  if (selectedTeamFilter === 'no-team') {
                    matchesTeam = !u.team;
                  } else {
                    const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                    matchesTeam = userTeamId === selectedTeamFilter;
                  }
                }
                
                return matchesSearch && matchesTeam;
              }).map(u => {
                const userTasks = allTasks.filter(t => 
                  (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id) === u.id
                );
                
                const todoCount = userTasks.filter(t => t.status === 'todo').length;
                const doingCount = userTasks.filter(t => t.status === 'doing').length;
                const doneCount = userTasks.filter(t => t.status === 'done').length;
                const totalCount = userTasks.length;
                const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                
                return (
                  <tr key={u.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {u.team ? (
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          🏢 {getTeamName(u)}
                        </span>
                      ) : (
                        <span className="inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold">
                          No Team
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shadow-sm">
                        {todoCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold text-sm shadow-sm">
                        {doingCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm shadow-sm">
                        {doneCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm shadow-sm">
                        {totalCount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPercent === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              progressPercent >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              progressPercent >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${
                          progressPercent === 100 ? 'text-green-600' :
                          progressPercent >= 70 ? 'text-blue-600' :
                          progressPercent >= 40 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          const userTaskDetails = document.getElementById(`user-tasks-${u.id}`);
                          if (userTaskDetails) {
                            userTaskDetails.classList.toggle('hidden');
                          }
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all hover:scale-105"
                      >
                        👁️ View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.filter(u => {
          const matchesSearch = searchQuery.trim() === '' || 
            u.name.toLowerCase().includes(searchQuery.toLowerCase());
          let matchesTeam = true;
          if (selectedTeamFilter) {
            if (selectedTeamFilter === 'no-team') {
              matchesTeam = !u.team;
            } else {
              const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
              matchesTeam = userTeamId === selectedTeamFilter;
            }
          }
          return matchesSearch && matchesTeam;
        }).length === 0 && (
          <div className="text-center py-10 text-gray-400 mt-5">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-lg font-semibold">No users found</p>
            <p className="text-sm mt-2">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Expandable Task Details */}
      {users.filter(u => {
        const matchesSearch = searchQuery.trim() === '' || 
          u.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesTeam = true;
        if (selectedTeamFilter) {
          if (selectedTeamFilter === 'no-team') {
            matchesTeam = !u.team;
          } else {
            const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
            matchesTeam = userTeamId === selectedTeamFilter;
          }
        }
        return matchesSearch && matchesTeam;
      }).map(u => {
        const userTasks = allTasks.filter(t => 
          (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id) === u.id
        );
        
        if (userTasks.length === 0) return null;
        
        const todoTasks = userTasks.filter(t => t.status === 'todo');
        const doingTasks = userTasks.filter(t => t.status === 'doing');
        const doneTasks = userTasks.filter(t => t.status === 'done');
        
        return (
          <div key={`details-${u.id}`} id={`user-tasks-${u.id}`} className="hidden bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  <span>{u.name}'s Tasks</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1">{u.email}</p>
              </div>
              <button
                onClick={() => {
                  const userTaskDetails = document.getElementById(`user-tasks-${u.id}`);
                  if (userTaskDetails) {
                    userTaskDetails.classList.add('hidden');
                  }
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* To-Do Column */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h5 className="text-sm font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                  <span>📝</span>
                  <span>To-Do ({todoTasks.length})</span>
                </h5>
                {todoTasks.length === 0 ? (
                  <p className="text-xs text-blue-400 italic text-center py-4">No pending tasks</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                    {todoTasks.map(task => {
                      const priorityStyle = getPriorityStyle(task.priority || 'medium');
                      return (
                        <div key={task._id} className="bg-white rounded-lg p-3 shadow-sm border border-blue-200 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="font-semibold text-sm text-gray-800 flex-1">{task.title}</div>
                            <span className={`${priorityStyle.badge} px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0`}>
                              <span>{priorityStyle.icon}</span>
                            </span>
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Doing Column */}
              <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                <h5 className="text-sm font-bold text-orange-700 uppercase mb-3 flex items-center gap-2">
                  <span>🚀</span>
                  <span>Doing ({doingTasks.length})</span>
                </h5>
                {doingTasks.length === 0 ? (
                  <p className="text-xs text-orange-400 italic text-center py-4">No tasks in progress</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100">
                    {doingTasks.map(task => {
                      const priorityStyle = getPriorityStyle(task.priority || 'medium');
                      return (
                        <div key={task._id} className="bg-white rounded-lg p-3 shadow-sm border border-orange-200 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="font-semibold text-sm text-gray-800 flex-1">{task.title}</div>
                            <span className={`${priorityStyle.badge} px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0`}>
                              <span>{priorityStyle.icon}</span>
                            </span>
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Done Column */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <h5 className="text-sm font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                  <span>✅</span>
                  <span>Done ({doneTasks.length})</span>
                </h5>
                {doneTasks.length === 0 ? (
                  <p className="text-xs text-green-400 italic text-center py-4">No completed tasks</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100">
                    {doneTasks.map(task => {
                      const priorityStyle = getPriorityStyle(task.priority || 'medium');
                      return (
                        <div key={task._id} className="bg-white rounded-lg p-3 shadow-sm border border-green-200 hover:shadow-md transition-all opacity-80">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="font-semibold text-sm text-gray-800 flex-1 line-through">{task.title}</div>
                            <span className={`${priorityStyle.badge} px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0`}>
                              <span>{priorityStyle.icon}</span>
                            </span>
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminTasksSummary;
