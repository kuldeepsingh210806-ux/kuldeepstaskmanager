import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';

export default function CalendarView() {
  const { tasks, sessions } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getDayData = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => {
      if (t.dueDate) {
        return format(parseISO(t.dueDate), 'yyyy-MM-dd') === dayStr;
      }
      return false;
    });
    const daySessions = sessions.filter(s => 
      format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr && s.type === 'work' && s.completed
    );
    const studyMinutes = daySessions.reduce((acc, s) => acc + s.duration / 60, 0);
    const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = dayTasks.filter(t => t.status !== 'completed').length;

    return { dayTasks, daySessions, studyMinutes, completedTasks, pendingTasks };
  };

  const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Calendar</h1>
        <p className="text-slate-400 mt-1">View your tasks and study sessions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const { studyMinutes, completedTasks, pendingTasks } = getDayData(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const hasActivity = studyMinutes > 0 || completedTasks > 0 || pendingTasks > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative p-2 rounded-xl text-sm transition-all min-h-[60px] md:min-h-[70px] flex flex-col items-center',
                    !isCurrentMonth && 'opacity-30',
                    isSelected
                      ? 'bg-violet-600/30 border border-violet-500/30'
                      : 'hover:bg-slate-700/30 border border-transparent',
                    isToday(day) && !isSelected && 'border-violet-500/20'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isToday(day) ? 'text-violet-400' : isSelected ? 'text-white' : 'text-slate-300'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasActivity && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {studyMinutes > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" title={`${Math.round(studyMinutes)}m studied`} />
                      )}
                      {completedTasks > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${completedTasks} completed`} />
                      )}
                      {pendingTasks > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${pendingTasks} pending`} />
                      )}
                    </div>
                  )}
                  {studyMinutes > 0 && (
                    <span className="text-[9px] text-slate-500 mt-0.5 hidden md:block">
                      {Math.round(studyMinutes)}m
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-xs text-slate-400">Study</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-1">
                {format(selectedDate, 'EEEE')}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>

              {selectedDayData && (
                <div className="space-y-4">
                  {/* Study Summary */}
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-violet-400" />
                      <span className="text-sm font-medium text-violet-300">Study Time</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(selectedDayData.studyMinutes)} min
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedDayData.daySessions.length} session{selectedDayData.daySessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Tasks */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Tasks ({selectedDayData.dayTasks.length})
                    </h4>
                    {selectedDayData.dayTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No tasks for this day</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayData.dayTasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-700/30"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                            ) : (
                              <AlertTriangle size={14} className="text-amber-400 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-xs font-medium',
                                task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
                              )}>
                                {task.title}
                              </p>
                              <p className="text-[10px] text-slate-500">{task.category}</p>
                            </div>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded',
                              {
                                'bg-slate-600/50 text-slate-400': task.priority === 'low',
                                'bg-blue-600/30 text-blue-300': task.priority === 'medium',
                                'bg-amber-600/30 text-amber-300': task.priority === 'high',
                                'bg-red-600/30 text-red-300': task.priority === 'urgent',
                              }
                            )}>
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sessions */}
                  {selectedDayData.daySessions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Sessions</h4>
                      <div className="space-y-1.5">
                        {selectedDayData.daySessions.map(session => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/30"
                          >
                            <div>
                              <p className="text-xs font-medium text-white">{session.category}</p>
                              <p className="text-[10px] text-slate-500">
                                {format(parseISO(session.startTime), 'h:mm a')}
                              </p>
                            </div>
                            <span className="text-xs text-slate-300">
                              {Math.round(session.duration / 60)}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">Select a date to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
