import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import type { User, Task, StudySession } from '../../types';
import {
  Shield,
  Users,
  Search,
  Eye,
  Trash2,
  LogOut,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  ListTodo,
  Phone,
  Lock,
  Calendar,
  AlertTriangle,
  GraduationCap,
  X,
  UserCircle,
  Activity,
  Target,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';

export default function AdminPanel() {
  const { logout, getAllUsers, getUserData, deleteUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedPerf, setExpandedPerf] = useState<UserPerfData | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const [selectedPerf, setSelectedPerf] = useState<UserPerfData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'created'>('recent');
  const loading = false;

  const loadUsers = useCallback(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const getFilteredUsers = () => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.mobile.includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'recent') return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  };

  const filteredUsers = getFilteredUsers();

  const computePerformance = (tasks: Task[], sessions: StudySession[]): UserPerfData => {
    const workSessions = sessions.filter(s => s.type === 'work' && s.completed);
    const totalStudyMin = workSessions.reduce((a, s) => a + s.duration / 60, 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const avgSessionMin = workSessions.length > 0 ? totalStudyMin / workSessions.length : 0;

    const dates = new Set(workSessions.map(s => new Date(s.startTime).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      if (dates.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }

    const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today }).map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const mins = workSessions
        .filter(s => format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr)
        .reduce((a, s) => a + s.duration / 60, 0);
      return { day: format(day, 'EEE'), mins: Math.round(mins) };
    });

    const catMap = new Map<string, number>();
    workSessions.forEach(s => { catMap.set(s.category, (catMap.get(s.category) || 0) + s.duration / 60); });
    const categories = Array.from(catMap.entries())
      .map(([name, mins]) => ({ name, mins: Math.round(mins) }))
      .sort((a, b) => b.mins - a.mins);

    const priorities = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    return {
      totalStudyMin, totalTasks, completedTasks, completionRate,
      avgSessionMin, streak, totalSessions: workSessions.length,
      last7, categories, priorities, tasks, sessions: workSessions,
    };
  };

  const handleExpandUser = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedPerf(null);
      return;
    }
    setExpandedUser(userId);
    const data = getUserData(userId);
    const perf = computePerformance(data.tasks as Task[], data.sessions as StudySession[]);
    setExpandedPerf(perf);
  };

  const handleViewDetail = (userId: string) => {
    setSelectedUserDetail(userId);
    const data = getUserData(userId);
    const perf = computePerformance(data.tasks as Task[], data.sessions as StudySession[]);
    setSelectedPerf(perf);
  };

  const handleDeleteUser = (userId: string) => {
    try {
      deleteUser(userId);
      setShowDeleteConfirm(null);
      setExpandedUser(null);
      setSelectedUserDetail(null);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Calculate totals
  const activeNow = users.filter(u => u.isLoggedIn).length;

  const selectedUser = selectedUserDetail ? users.find(u => u.id === selectedUserDetail) : null;

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
              <p className="text-[11px] text-slate-400">Manage users & monitor performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AdminStat icon={<Users size={18} />} label="Total Users" value={users.length} color="from-violet-500 to-indigo-500" />
          <AdminStat icon={<Activity size={18} />} label="Active Now" value={activeNow} color="from-emerald-500 to-teal-500" />
          <AdminStat icon={<ListTodo size={18} />} label="Registered" value={users.length} color="from-cyan-500 to-blue-500" />
          <AdminStat icon={<Clock size={18} />} label="Users Online" value={activeNow} color="from-pink-500 to-rose-500" />
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'name' | 'recent' | 'created')}
            className="px-3 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="recent">Sort: Last Login</option>
            <option value="name">Sort: Name</option>
            <option value="created">Sort: Date Joined</option>
          </select>
        </div>

        {/* Users list */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-white/5">
            <Users className="mx-auto mb-3 text-slate-600" size={40} />
            <p className="text-slate-400 font-medium">
              {users.length === 0 ? 'No registered users yet' : 'No users match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUser === user.id;

              return (
                <div
                  key={user.id}
                  className="bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                >
                  {/* User Row */}
                  <div className="flex items-center gap-3 p-4">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0',
                      user.isLoggedIn
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-slate-600 to-slate-700'
                    )}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        {user.isLoggedIn && (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone size={10} />
                          +91 {user.mobile}
                        </span>
                        <span className="text-xs text-slate-500">
                          Joined {format(parseISO(user.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(user.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="View full details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => handleExpandUser(user.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Quick View */}
                  {isExpanded && expandedPerf && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <MiniStat label="Study Time" value={`${Math.round(expandedPerf.totalStudyMin)}m`} icon={<Clock size={13} />} />
                            <MiniStat label="Tasks" value={`${expandedPerf.completedTasks}/${expandedPerf.totalTasks}`} icon={<CheckCircle2 size={13} />} />
                            <MiniStat label="Sessions" value={`${expandedPerf.totalSessions}`} icon={<Target size={13} />} />
                            <MiniStat label="Streak" value={`${expandedPerf.streak}d`} icon={<Flame size={13} />} />
                          </div>
                          <div className="flex flex-wrap gap-3 p-3 bg-slate-900/50 rounded-lg mb-3">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-500" />
                              <span className="text-xs text-slate-300 font-mono">{user.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Lock size={12} className="text-slate-500" />
                              <span className="text-xs text-slate-300 font-mono tracking-widest">{user.password}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-500" />
                              <span className="text-xs text-slate-400">
                                Last login: {format(parseISO(user.lastLoginAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-end gap-1 h-16">
                            {expandedPerf.last7.map((d, i) => {
                              const maxMins = Math.max(...expandedPerf.last7.map(x => x.mins), 1);
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div className="w-full bg-slate-700/30 rounded-t relative" style={{ height: '48px' }}>
                                    <div
                                      className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all"
                                      style={{ height: `${(d.mins / maxMins) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-slate-500">{d.day}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete User</h3>
                <p className="text-xs text-slate-400">
                  {users.find(u => u.id === showDeleteConfirm)?.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              This will permanently delete this user account and all their study data from the cloud. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm text-white font-medium hover:bg-red-500"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          perf={selectedPerf}
          onClose={() => { setSelectedUserDetail(null); setSelectedPerf(null); }}
        />
      )}
    </div>
  );
}

// ===== Sub-components =====

function AdminStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4">
      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-2', color)}>
        {icon}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2.5 bg-slate-900/50 rounded-lg text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">{icon}<span className="text-[10px]">{label}</span></div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

interface UserPerfData {
  totalStudyMin: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgSessionMin: number;
  streak: number;
  totalSessions: number;
  last7: { day: string; mins: number }[];
  categories: { name: string; mins: number }[];
  priorities: { urgent: number; high: number; medium: number; low: number };
  tasks: Task[];
  sessions: StudySession[];
}

function UserDetailModal({ user, perf, onClose }: { user: User; perf: UserPerfData | null; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'tasks' | 'sessions'>('overview');

  const catColors = ['bg-violet-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 'bg-teal-500'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-white/10 shadow-2xl my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-white/5">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white',
            user.isLoggedIn
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-slate-600 to-slate-700'
          )}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              {user.isLoggedIn && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone size={11} /> +91 {user.mobile}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Lock size={11} /> PIN: <span className="font-mono tracking-widest text-amber-400">{user.password}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* User Meta */}
        <div className="px-6 py-3 bg-slate-800/30 border-b border-white/5 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Calendar size={11} /> Joined: {format(parseISO(user.createdAt), 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Last Login: {format(parseISO(user.lastLoginAt), 'MMM d, yyyy h:mm a')}</span>
          <span className="flex items-center gap-1"><UserCircle size={11} /> ID: {user.id.slice(0, 8)}...</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {([['overview', 'Overview'], ['tasks', 'Tasks'], ['sessions', 'Sessions']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!perf ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-slate-400">No data available</span>
            </div>
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
                  <p className="text-xl font-bold text-white">{Math.round(perf.totalStudyMin)}m</p>
                  <p className="text-[10px] text-slate-400">Total Study</p>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <p className="text-xl font-bold text-white">{perf.completedTasks}/{perf.totalTasks}</p>
                  <p className="text-[10px] text-slate-400">Tasks Done</p>
                </div>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
                  <p className="text-xl font-bold text-white">{perf.totalSessions}</p>
                  <p className="text-[10px] text-slate-400">Sessions</p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                  <p className="text-xl font-bold text-white">{perf.streak}d</p>
                  <p className="text-[10px] text-slate-400">Streak</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Task Completion Rate</span>
                  <span className="text-sm font-bold text-white">{Math.round(perf.completionRate)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${perf.completionRate}%` }} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Last 7 Days Activity</h4>
                <div className="flex items-end gap-2 h-32">
                  {perf.last7.map((d, i) => {
                    const maxMins = Math.max(...perf.last7.map(x => x.mins), 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-500">{d.mins > 0 ? `${d.mins}m` : ''}</span>
                        <div className="w-full bg-slate-700/30 rounded-t relative" style={{ height: '100px' }}>
                          <div className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all" style={{ height: `${(d.mins / maxMins) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {perf.categories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {perf.categories.map((cat, i) => {
                      const totalCatMins = perf.categories.reduce((a, c) => a + c.mins, 0) || 1;
                      return (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white">{cat.name}</span>
                            <span className="text-[11px] text-slate-400">{cat.mins}m ({Math.round((cat.mins / totalCatMins) * 100)}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', catColors[i % catColors.length])} style={{ width: `${(cat.mins / totalCatMins) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Task Priorities</h4>
                <div className="flex gap-3">
                  {([
                    ['urgent', 'Urgent', 'bg-red-500/15 text-red-400 border-red-500/20'],
                    ['high', 'High', 'bg-amber-500/15 text-amber-400 border-amber-500/20'],
                    ['medium', 'Medium', 'bg-blue-500/15 text-blue-400 border-blue-500/20'],
                    ['low', 'Low', 'bg-slate-500/15 text-slate-400 border-slate-500/20'],
                  ] as const).map(([key, label, cls]) => (
                    <div key={key} className={cn('flex-1 p-2.5 rounded-lg border text-center', cls)}>
                      <p className="text-lg font-bold">{perf.priorities[key]}</p>
                      <p className="text-[10px] opacity-80">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'tasks' ? (
            <div className="space-y-2">
              {perf.tasks.length === 0 ? (
                <p className="text-center py-12 text-slate-500 text-sm">No tasks created yet</p>
              ) : (
                perf.tasks.map(task => (
                  <div key={task.id} className="p-3 bg-slate-800/30 rounded-lg border border-white/5">
                    <div className="flex items-start gap-2">
                      {task.status === 'completed'
                        ? <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        : <ListTodo size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white')}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{task.category}</span>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded', {
                            'bg-red-500/20 text-red-300': task.priority === 'urgent',
                            'bg-amber-500/20 text-amber-300': task.priority === 'high',
                            'bg-blue-500/20 text-blue-300': task.priority === 'medium',
                            'bg-slate-500/20 text-slate-300': task.priority === 'low',
                          })}>{task.priority}</span>
                          <span className="text-[10px] text-slate-500">{task.status}</span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-500">Due: {format(parseISO(task.dueDate), 'MMM d')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {perf.sessions.length === 0 ? (
                <p className="text-center py-12 text-slate-500 text-sm">No study sessions yet</p>
              ) : (
                perf.sessions.slice(0, 50).map(session => (
                  <div key={session.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={14} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{session.category}</p>
                      <p className="text-[10px] text-slate-500">{format(parseISO(session.startTime), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-300">{Math.round(session.duration / 60)}m</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
