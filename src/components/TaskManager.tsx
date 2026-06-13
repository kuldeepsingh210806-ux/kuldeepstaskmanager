import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  X,
  Tag,
} from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import type { Task, Priority, TaskStatus } from '../types';


export default function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask, addSubtask, deleteSubtask, settings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'due'>('date');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority);
    if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(t => t.category === filterCategory);

    result.sort((a, b) => {
      if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortBy === 'due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, searchQuery, filterPriority, filterStatus, filterCategory, sortBy]);

  const handleSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask({
        ...data,
        status: 'todo',
      });
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    addSubtask(taskId, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const statusIcons = {
    'todo': <Circle size={18} className="text-slate-400" />,
    'in-progress': <Clock size={18} className="text-blue-400" />,
    'completed': <CheckCircle2 size={18} className="text-emerald-400" />,
  };

  const priorityBadges = {
    low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors',
              showFilters
                ? 'bg-violet-600/20 border-violet-500/30 text-violet-300'
                : 'bg-slate-800/50 border-white/10 text-slate-400 hover:text-white'
            )}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-800/30 rounded-xl border border-white/5">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="all">All Categories</option>
              {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'priority' | 'due')}
              className="px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="date">Sort: Newest</option>
              <option value="priority">Sort: Priority</option>
              <option value="due">Sort: Due Date</option>
            </select>
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-white/5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-sm text-slate-500 mt-1">Create a new task to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const isExpanded = expandedTask === task.id;
            const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'completed';
            const isDueToday = task.dueDate && isToday(parseISO(task.dueDate));
            const subtaskProgress = task.subtasks.length > 0
              ? (task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100
              : 0;

            return (
              <div
                key={task.id}
                className={cn(
                  'bg-slate-800/50 rounded-xl border transition-all duration-200',
                  isOverdue ? 'border-red-500/30' : 'border-white/5 hover:border-white/10',
                  task.status === 'completed' && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-0.5 hover:scale-110 transition-transform"
                  >
                    {statusIcons[task.status]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className={cn(
                        'text-sm font-medium text-white',
                        task.status === 'completed' && 'line-through text-slate-400'
                      )}>
                        {task.title}
                      </p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', priorityBadges[task.priority])}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && !isExpanded && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                        {task.category}
                      </span>
                      {task.dueDate && (
                        <span className={cn(
                          'text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full',
                          isOverdue ? 'bg-red-500/20 text-red-300' : isDueToday ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/50 text-slate-400'
                        )}>
                          {isOverdue && <AlertTriangle size={10} />}
                          {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {task.estimatedMinutes > 0 && (
                        <span className="text-[11px] text-slate-500">
                          ~{task.estimatedMinutes}min
                        </span>
                      )}
                      {task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag size={10} className="text-slate-500" />
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] text-slate-500">{tag}</span>
                          ))}
                        </div>
                      )}
                      {task.subtasks.length > 0 && (
                        <span className="text-[11px] text-slate-500">
                          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                    {task.subtasks.length > 0 && (
                      <div className="w-full h-1 bg-slate-700/50 rounded-full mt-2 overflow-hidden max-w-[200px]">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${subtaskProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingTask(task); setShowForm(true); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/5 mt-0">
                    <div className="pt-3 space-y-3">
                      {task.description && (
                        <p className="text-sm text-slate-300">{task.description}</p>
                      )}

                      {/* Status Changer */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Status:</span>
                        {(['todo', 'in-progress', 'completed'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => updateTask(task.id, {
                              status,
                              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
                            })}
                            className={cn(
                              'text-xs px-2 py-1 rounded-lg border transition-colors',
                              task.status === status
                                ? 'bg-violet-600/30 border-violet-500/30 text-violet-300'
                                : 'border-white/10 text-slate-400 hover:text-white'
                            )}
                          >
                            {status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Completed'}
                          </button>
                        ))}
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag size={12} className="text-slate-400" />
                          {task.tags.map(tag => (
                            <span key={tag} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Subtasks */}
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Subtasks</p>
                        <div className="space-y-1">
                          {task.subtasks.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 group">
                              <button onClick={() => toggleSubtask(task.id, sub.id)}>
                                {sub.completed
                                  ? <CheckCircle2 size={14} className="text-emerald-400" />
                                  : <Circle size={14} className="text-slate-500" />
                                }
                              </button>
                              <span className={cn(
                                'text-sm flex-1',
                                sub.completed ? 'line-through text-slate-500' : 'text-slate-300'
                              )}>
                                {sub.title}
                              </span>
                              <button
                                onClick={() => deleteSubtask(task.id, sub.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Add subtask..."
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubtask(task.id)}
                            className="flex-1 px-3 py-1.5 bg-slate-700/30 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                          />
                          <button
                            onClick={() => handleAddSubtask(task.id)}
                            className="px-3 py-1.5 bg-violet-600/30 text-violet-300 rounded-lg text-xs hover:bg-violet-600/50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskFormModal
          task={editingTask}
          categories={settings.categories}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  dueDate: string;
  estimatedMinutes: number;
  tags: string[];
}

function TaskFormModal({
  task,
  categories,
  onSubmit,
  onClose,
}: {
  task: Task | null;
  categories: string[];
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState(task?.category || categories[0]);
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes || 30);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(task?.tags || []);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : '',
      estimatedMinutes,
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Complete Chapter 5 exercises"
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Est. Minutes</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-xs text-slate-300">
                Add
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm text-white font-medium hover:from-violet-500 hover:to-indigo-500 shadow-lg">
              {task ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
