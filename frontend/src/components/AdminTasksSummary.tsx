import React, { useMemo, useState } from 'react';
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

const toDateKey = (dateValue: string | Date) => {
  const d = new Date(dateValue);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getAssignedUserId = (task: any) => {
  if (!task?.assignedTo) return null;
  if (typeof task.assignedTo === 'string') return task.assignedTo;
  return task.assignedTo._id || task.assignedTo.id || null;
};

const AdminTasksSummary: React.FC<AdminTasksSummaryProps> = ({
  allTasks,
  users,
  teams,
  searchQuery,
  setSearchQuery,
  selectedTeamFilter,
  setSelectedTeamFilter,
  getTeamName,
  getPriorityStyle
}) => {
  const [openHistoryUserId, setOpenHistoryUserId] = useState<string | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery.trim() === '' || u.name.toLowerCase().includes(searchQuery.toLowerCase());

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
    });
  }, [users, searchQuery, selectedTeamFilter]);

  const tableRows = useMemo(() => {
    return filteredUsers.map((u) => {
      const userTasks = allTasks.filter((t) => getAssignedUserId(t) === u.id);

      const todayTodo = userTasks.filter((t) => t.status === 'todo' && t.createdAt && toDateKey(t.createdAt) === todayKey);
      const todayDoing = userTasks.filter((t) => t.status === 'doing' && t.createdAt && toDateKey(t.createdAt) === todayKey);
      const todayDone = userTasks.filter((t) => t.status === 'done' && t.updatedAt && toDateKey(t.updatedAt) === todayKey);

      const todayTotal = todayTodo.length + todayDoing.length + todayDone.length;
      const todayProgress = todayTotal > 0 ? Math.round((todayDone.length / todayTotal) * 100) : 0;

      const doneTasks = userTasks
        .filter((t) => t.status === 'done' && t.updatedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const doneHistory = doneTasks.reduce((acc: Record<string, any[]>, task) => {
        const key = toDateKey(task.updatedAt);
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {});

      return {
        user: u,
        todayTodo,
        todayDoing,
        todayDone,
        todayTotal,
        todayProgress,
        doneHistory,
        historyDates: Object.keys(doneHistory).sort((a, b) => (a < b ? 1 : -1))
      };
    });
  }, [filteredUsers, allTasks, todayKey]);

  const openHistoryRow = tableRows.find((r) => r.user.id === openHistoryUserId) || null;

  const renderTodayTaskList = (tasks: any[], tone: 'blue' | 'orange' | 'green') => {
    const toneMap = {
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700'
    };

    if (tasks.length === 0) {
      return <span className="text-xs text-gray-400">No tasks</span>;
    }

    return (
      <div className="space-y-1 text-left">
        {tasks.map((task) => (
          <div key={task._id} className={`px-2 py-1 rounded text-xs font-medium ${toneMap[tone]}`}>
            {task.title}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white shadow-md">
          <div className="text-xs text-purple-100">All Tasks</div>
          <div className="text-2xl font-bold">{allTasks.length}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-md">
          <div className="text-xs text-blue-100">To-Do</div>
          <div className="text-2xl font-bold">{allTasks.filter((t) => t.status === 'todo').length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg p-3 text-white shadow-md">
          <div className="text-xs text-orange-100">In Progress</div>
          <div className="text-2xl font-bold">{allTasks.filter((t) => t.status === 'doing').length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white shadow-md">
          <div className="text-xs text-green-100">Completed</div>
          <div className="text-2xl font-bold">{allTasks.filter((t) => t.status === 'done').length}</div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <div className="mb-4">
          <h3 className="text-gray-800 text-xl font-bold">User Performance Summary</h3>
          <p className="text-xs text-gray-600">Table shows only today tasks. View Details shows all past days done tasks.</p>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
          />
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-indigo-500"
          >
            <option value="">All Teams ({users.length} users)</option>
            {teams.map((team) => {
              const teamUserCount = users.filter((u) => {
                const userTeamId = u.team ? (typeof u.team === 'string' ? u.team : u.team._id) : null;
                return userTeamId === team._id;
              }).length;
              return (
                <option key={team._id} value={team._id}>
                  {team.name} ({teamUserCount} users)
                </option>
              );
            })}
            <option value="no-team">Users Without Team ({users.filter((u) => !u.team).length})</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Employee</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Team</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Today To-Do Tasks</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Today Doing Tasks</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Today Done Tasks</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Today Total</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Today Progress</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.user.id} className="border-b border-gray-100 hover:bg-indigo-50/50">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-gray-800">{row.user.name}</div>
                    <div className="text-xs text-gray-500">{row.user.email}</div>
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-700">{getTeamName(row.user)}</td>
                  <td className="px-3 py-2 align-top min-w-[220px]">{renderTodayTaskList(row.todayTodo, 'blue')}</td>
                  <td className="px-3 py-2 align-top min-w-[220px]">{renderTodayTaskList(row.todayDoing, 'orange')}</td>
                  <td className="px-3 py-2 align-top min-w-[220px]">{renderTodayTaskList(row.todayDone, 'green')}</td>
                  <td className="px-3 py-2 text-center"><span className="inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs">{row.todayTotal}</span></td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center justify-center min-w-[42px] h-7 px-2 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                      {row.todayProgress}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() =>
                        setOpenHistoryUserId((prev) => (prev === row.user.id ? null : row.user.id))
                      }
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700"
                    >
                      {openHistoryUserId === row.user.id ? 'Hide' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tableRows.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No employees found for current filters.</div>
        )}
      </div>

      {openHistoryRow && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-800">{openHistoryRow.user.name} - Task Details</h4>
              <p className="text-xs text-gray-500">Today task lists + done history (today and previous days)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-xs font-bold text-blue-700 mb-2">Today To-Do ({openHistoryRow.todayTodo.length})</h5>
              {openHistoryRow.todayTodo.length === 0 ? (
                <p className="text-xs text-blue-400">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {openHistoryRow.todayTodo.map((task) => (
                    <div key={task._id} className="bg-white rounded border border-blue-100 p-2">
                      <div className="text-xs font-semibold text-gray-800">{task.title}</div>
                      {task.description && <div className="text-[11px] text-gray-600 mt-1">{task.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h5 className="text-xs font-bold text-orange-700 mb-2">Today Doing ({openHistoryRow.todayDoing.length})</h5>
              {openHistoryRow.todayDoing.length === 0 ? (
                <p className="text-xs text-orange-400">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {openHistoryRow.todayDoing.map((task) => (
                    <div key={task._id} className="bg-white rounded border border-orange-100 p-2">
                      <div className="text-xs font-semibold text-gray-800">{task.title}</div>
                      {task.description && <div className="text-[11px] text-gray-600 mt-1">{task.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="text-xs font-bold text-green-700 mb-2">Today Done ({openHistoryRow.todayDone.length})</h5>
              {openHistoryRow.todayDone.length === 0 ? (
                <p className="text-xs text-green-400">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {openHistoryRow.todayDone.map((task) => (
                    <div key={task._id} className="bg-white rounded border border-green-100 p-2">
                      <div className="text-xs font-semibold text-gray-800 line-through">{task.title}</div>
                      {task.description && <div className="text-[11px] text-gray-600 mt-1">{task.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {openHistoryRow.historyDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No completed task history available.</div>
          ) : (
            <div className="space-y-4">
              {openHistoryRow.historyDates.map((dateKey) => (
                <div key={dateKey} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {new Date(dateKey).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      {openHistoryRow.doneHistory[dateKey].length} done
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {openHistoryRow.doneHistory[dateKey].map((task) => {
                      const priorityStyle = getPriorityStyle(task.priority || 'medium');
                      return (
                        <div key={task._id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-sm text-gray-800 line-through">{task.title}</div>
                            <span className={`${priorityStyle.badge} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                              {priorityStyle.text}
                            </span>
                          </div>
                          {task.description && <div className="text-xs text-gray-600 mt-1">{task.description}</div>}
                          <div className="text-[11px] text-gray-500 mt-1">
                            Completed: {new Date(task.updatedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTasksSummary;
