import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import {
  Clock,
  CheckCircle2,
  Flame,
  TrendingUp,
  BarChart3,
  Target,
  BookOpen,
  Award,
} from 'lucide-react';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';

export default function Statistics() {
  const { tasks, sessions, getStreak, settings } = useApp();

  const stats = useMemo(() => {
    const today = new Date();
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    const last30Days = eachDayOfInterval({ start: subDays(today, 29), end: today });

    const workSessions = sessions.filter(s => s.type === 'work' && s.completed);

    // Daily study data for chart
    const dailyData = last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayMins = workSessions
        .filter(s => format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr)
        .reduce((acc, s) => acc + s.duration / 60, 0);
      return { date: format(day, 'EEE'), minutes: Math.round(dayMins), fullDate: dayStr };
    });

    // Monthly study data
    const monthlyData = last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayMins = workSessions
        .filter(s => format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr)
        .reduce((acc, s) => acc + s.duration / 60, 0);
      return { date: format(day, 'd'), minutes: Math.round(dayMins) };
    });

    // Category breakdown
    const categoryMap = new Map<string, number>();
    workSessions.forEach(s => {
      const mins = s.duration / 60;
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + mins);
    });
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, minutes]) => ({ name, minutes: Math.round(minutes) }))
      .sort((a, b) => b.minutes - a.minutes);

    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Priority distribution
    const priorityDist = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    // Total study time
    const totalStudyMinutes = workSessions.reduce((acc, s) => acc + s.duration / 60, 0);
    const totalSessions = workSessions.length;
    const avgSessionLength = totalSessions > 0 ? totalStudyMinutes / totalSessions : 0;

    // Best day
    const bestDayMinutes = Math.max(...dailyData.map(d => d.minutes), 0);
    const bestDay = dailyData.find(d => d.minutes === bestDayMinutes);

    return {
      dailyData,
      monthlyData,
      categoryData,
      totalTasks,
      completedTasks,
      completionRate,
      priorityDist,
      totalStudyMinutes,
      totalSessions,
      avgSessionLength,
      bestDay,
      bestDayMinutes,
    };
  }, [tasks, sessions]);

  const streak = getStreak();
  const maxDailyMinutes = Math.max(...stats.dailyData.map(d => d.minutes), 1);
  const maxMonthlyMinutes = Math.max(...stats.monthlyData.map(d => d.minutes), 1);
  const totalCategoryMinutes = stats.categoryData.reduce((a, c) => a + c.minutes, 0) || 1;

  const categoryColors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 'bg-teal-500',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Statistics</h1>
        <p className="text-slate-400 mt-1">Track your study progress and productivity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Clock size={20} />}
          label="Total Study Time"
          value={`${Math.round(stats.totalStudyMinutes / 60)}h ${Math.round(stats.totalStudyMinutes % 60)}m`}
          color="from-violet-500 to-indigo-500"
        />
        <MetricCard
          icon={<BookOpen size={20} />}
          label="Total Sessions"
          value={`${stats.totalSessions}`}
          color="from-cyan-500 to-blue-500"
        />
        <MetricCard
          icon={<Flame size={20} />}
          label="Current Streak"
          value={`${streak} days`}
          color="from-orange-500 to-red-500"
        />
        <MetricCard
          icon={<Award size={20} />}
          label="Avg Session"
          value={`${Math.round(stats.avgSessionLength)}m`}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-violet-400" />
              Last 7 Days
            </h2>
            {stats.bestDay && (
              <span className="text-xs text-slate-400">
                Best: {stats.bestDay.date} ({stats.bestDayMinutes}m)
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 h-48">
            {stats.dailyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">
                  {day.minutes > 0 ? `${day.minutes}m` : ''}
                </span>
                <div className="w-full relative bg-slate-700/30 rounded-t-lg overflow-hidden" style={{ height: '160px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(day.minutes / maxDailyMinutes) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <Target size={18} className="text-indigo-400" />
            Study by Category
          </h2>
          {stats.categoryData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm">No study data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.categoryData.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{cat.name}</span>
                    <span className="text-xs text-slate-400">
                      {cat.minutes}m ({Math.round((cat.minutes / totalCategoryMinutes) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', categoryColors[i % categoryColors.length])}
                      style={{ width: `${(cat.minutes / totalCategoryMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Completion */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <CheckCircle2 size={18} className="text-emerald-400" />
            Task Completion
          </h2>
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="url(#completionGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.completionRate} ${100 - stats.completionRate}`}
                  strokeDashoffset="0"
                />
                <defs>
                  <linearGradient id="completionGrad">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{Math.round(stats.completionRate)}%</span>
                <span className="text-[10px] text-slate-400">Complete</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Total Tasks</span>
                <span className="text-sm font-medium text-white">{stats.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-400">Completed</span>
                <span className="text-sm font-medium text-white">{stats.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-400">Pending</span>
                <span className="text-sm font-medium text-white">{stats.totalTasks - stats.completedTasks}</span>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 mb-3">Priority Distribution</p>
            <div className="flex gap-2">
              {([
                ['urgent', 'Urgent', 'bg-red-500'],
                ['high', 'High', 'bg-amber-500'],
                ['medium', 'Medium', 'bg-blue-500'],
                ['low', 'Low', 'bg-slate-500'],
              ] as const).map(([key, label, color]) => (
                <div key={key} className="flex-1 text-center">
                  <div className={cn('w-full h-1.5 rounded-full mb-1.5', color)} style={{
                    opacity: stats.priorityDist[key] > 0 ? 1 : 0.2
                  }} />
                  <p className="text-sm font-medium text-white">{stats.priorityDist[key]}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Heatmap */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-cyan-400" />
            30-Day Activity
          </h2>
          <div className="grid grid-cols-10 gap-1.5">
            {stats.monthlyData.map((day, i) => {
              const intensity = day.minutes / maxMonthlyMinutes;
              return (
                <div
                  key={i}
                  className={cn(
                    'aspect-square rounded-md transition-all cursor-default',
                    day.minutes === 0
                      ? 'bg-slate-700/30'
                      : intensity < 0.33
                        ? 'bg-violet-900/50'
                        : intensity < 0.66
                          ? 'bg-violet-700/60'
                          : 'bg-violet-500/80'
                  )}
                  title={`Day ${day.date}: ${day.minutes}m`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-slate-500">Less</span>
            <div className="w-3 h-3 rounded-sm bg-slate-700/30" />
            <div className="w-3 h-3 rounded-sm bg-violet-900/50" />
            <div className="w-3 h-3 rounded-sm bg-violet-700/60" />
            <div className="w-3 h-3 rounded-sm bg-violet-500/80" />
            <span className="text-[10px] text-slate-500">More</span>
          </div>

          {/* Daily Goal Achievement */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 mb-2">Goal Achievement (Last 7 days)</p>
            <div className="flex gap-1">
              {stats.dailyData.map((day, i) => {
                const achieved = day.minutes >= settings.dailyGoalMinutes;
                return (
                  <div key={i} className="flex-1 text-center">
                    <div className={cn(
                      'w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-medium',
                      achieved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/30 text-slate-500 border border-transparent'
                    )}>
                      {achieved ? '✓' : '—'}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{day.date}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-4">
      <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', color)}>
        {icon}
      </div>
      <p className="text-lg md:text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
