import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export default function Dashboard() {
  const {
    tasks,
    sessions,
    settings,
    getTodayStudyMinutes,
    getWeekStudyHours,
    getStreak,
    setCurrentView,
  } = useApp();
  const { session } = useAuth();
  const firstName = session?.name?.split(' ')[0] || 'Student';

  const todayMinutes = getTodayStudyMinutes();
  const weekHours = getWeekStudyHours();
  const streak = getStreak();
  const completedToday = tasks.filter(t => t.completedAt && isToday(parseISO(t.completedAt))).length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = pendingTasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)));
  const todaySessions = sessions.filter(s => isToday(parseISO(s.startTime)) && s.completed && s.type === 'work').length;

  const upcomingTasks = pendingTasks
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const recentSessions = sessions
    .filter(s => s.completed && s.type === 'work')
    .slice(0, 5);



  const formatDueDate = (date: string) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return 'Today';
    if (isTomorrow(parsed)) return 'Tomorrow';
    return format(parsed, 'MMM d');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {firstName}! 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's your study overview for today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock size={20} />}
          label="Study Today"
          value={`${Math.round(todayMinutes)}m`}
          subValue={`Goal: ${settings.dailyGoalMinutes}m`}
          progress={(todayMinutes / settings.dailyGoalMinutes) * 100}
          color="from-violet-500 to-indigo-500"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="This Week"
          value={`${weekHours.toFixed(1)}h`}
          subValue={`Goal: ${settings.weeklyGoalHours}h`}
          progress={(weekHours / settings.weeklyGoalHours) * 100}
          color="from-cyan-500 to-blue-500"
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Streak"
          value={`${streak} days`}
          subValue={streak > 0 ? 'Keep it up!' : 'Start studying!'}
          color="from-orange-500 to-red-500"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Done Today"
          value={`${completedToday}`}
          subValue={`${todaySessions} sessions`}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          icon={<Timer size={18} />}
          label="Start Studying"
          color="bg-violet-600 hover:bg-violet-500"
          onClick={() => setCurrentView('timer')}
        />
        <QuickAction
          icon={<Target size={18} />}
          label="Add Task"
          color="bg-indigo-600 hover:bg-indigo-500"
          onClick={() => setCurrentView('tasks')}
        />
        <QuickAction
          icon={<TrendingUp size={18} />}
          label="View Stats"
          color="bg-cyan-600 hover:bg-cyan-500"
          onClick={() => setCurrentView('statistics')}
        />
        <QuickAction
          icon={<CheckCircle2 size={18} />}
          label="Calendar"
          color="bg-emerald-600 hover:bg-emerald-500"
          onClick={() => setCurrentView('calendar')}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Upcoming Tasks</h2>
            {overdueTasks.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                <AlertTriangle size={12} />
                {overdueTasks.length} overdue
              </span>
            )}
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Target className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No upcoming tasks</p>
              <button
                onClick={() => setCurrentView('tasks')}
                className="text-xs text-violet-400 hover:text-violet-300 mt-1"
              >
                Add your first task →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className={cn('w-2 h-2 rounded-full', {
                    'bg-slate-400': task.priority === 'low',
                    'bg-blue-400': task.priority === 'medium',
                    'bg-amber-400': task.priority === 'high',
                    'bg-red-400': task.priority === 'urgent',
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.category}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full whitespace-nowrap',
                    task.dueDate && isPast(parseISO(task.dueDate))
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-600/50 text-slate-300'
                  )}>
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setCurrentView('tasks')}
                className="w-full flex items-center justify-center gap-1 text-xs text-violet-400 hover:text-violet-300 py-2"
              >
                View all tasks <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Timer className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No study sessions yet</p>
              <button
                onClick={() => setCurrentView('timer')}
                className="text-xs text-violet-400 hover:text-violet-300 mt-1"
              >
                Start your first session →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Timer size={14} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{session.category}</p>
                    <p className="text-xs text-slate-400">
                      {format(parseISO(session.startTime), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <span className="text-sm text-slate-300 font-medium">
                    {Math.round(session.duration / 60)}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Distribution */}
      <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Task Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['todo', 'in-progress', 'completed'] as const).map(status => {
            const count = tasks.filter(t => t.status === status).length;
            const colors = {
              'todo': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
              'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              'completed': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            };
            const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'completed': 'Completed' };
            return (
              <div key={status} className={cn('p-4 rounded-xl border', colors[status])}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs mt-1 opacity-75">{labels[status]}</p>
              </div>
            );
          })}
          <div className="p-4 rounded-xl border bg-red-500/20 text-red-300 border-red-500/30">
            <p className="text-2xl font-bold">{overdueTasks.length}</p>
            <p className="text-xs mt-1 opacity-75">Overdue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, subValue, progress, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  progress?: number;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-4 md:p-5">
      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', color)}>
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-700/50 rounded-full mt-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', color)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      <p className="text-[11px] text-slate-500 mt-1.5">{subValue}</p>
    </div>
  );
}

function QuickAction({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-lg',
        color
      )}
    >
      {icon}
      {label}
    </button>
  );
}
