import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import {
  Timer,
  Target,
  Palette,
  Plus,
  X,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, tasks, sessions } = useApp();
  const [newCategory, setNewCategory] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleTimerChange = (key: string, value: number | boolean) => {
    updateSettings({
      timer: { ...settings.timer, [key]: value },
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      updateSettings({
        categories: [...settings.categories, newCategory.trim()],
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    updateSettings({
      categories: settings.categories.filter(c => c !== cat),
    });
  };

  const handleExportData = () => {
    // Export current in-memory data (already synced from cloud)
    const data = { tasks, sessions, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    alert('Import is not yet supported with cloud storage. Your data is already safely stored in the cloud.');
  };

  const handleResetData = () => {
    alert('To reset your data, please contact the admin or use the admin panel.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Customize your study experience</p>
      </div>

      {/* Timer Settings */}
      <section className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
          <Timer size={18} className="text-violet-400" />
          Timer Settings
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Work Duration (min)</label>
              <input
                type="number"
                value={settings.timer.workDuration}
                onChange={e => handleTimerChange('workDuration', Number(e.target.value))}
                min={1}
                max={120}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Short Break (min)</label>
              <input
                type="number"
                value={settings.timer.shortBreakDuration}
                onChange={e => handleTimerChange('shortBreakDuration', Number(e.target.value))}
                min={1}
                max={30}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Long Break (min)</label>
              <input
                type="number"
                value={settings.timer.longBreakDuration}
                onChange={e => handleTimerChange('longBreakDuration', Number(e.target.value))}
                min={1}
                max={60}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sessions Before Long Break</label>
            <input
              type="number"
              value={settings.timer.sessionsBeforeLongBreak}
              onChange={e => handleTimerChange('sessionsBeforeLongBreak', Number(e.target.value))}
              min={1}
              max={10}
              className="w-full max-w-[200px] px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="space-y-3 pt-2">
            <ToggleSetting
              label="Auto-start breaks"
              description="Automatically start break timer after work session"
              checked={settings.timer.autoStartBreaks}
              onChange={v => handleTimerChange('autoStartBreaks', v)}
            />
            <ToggleSetting
              label="Auto-start work"
              description="Automatically start work timer after break"
              checked={settings.timer.autoStartWork}
              onChange={v => handleTimerChange('autoStartWork', v)}
            />
            <ToggleSetting
              label="Sound notifications"
              description="Play sound when timer completes"
              checked={settings.timer.soundEnabled}
              onChange={v => handleTimerChange('soundEnabled', v)}
            />
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
          <Target size={18} className="text-indigo-400" />
          Study Goals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Goal (minutes)</label>
            <input
              type="number"
              value={settings.dailyGoalMinutes}
              onChange={e => updateSettings({ dailyGoalMinutes: Number(e.target.value) })}
              min={10}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Weekly Goal (hours)</label>
            <input
              type="number"
              value={settings.weeklyGoalHours}
              onChange={e => updateSettings({ weeklyGoalHours: Number(e.target.value) })}
              min={1}
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
          <Palette size={18} className="text-cyan-400" />
          Categories
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.categories.map(cat => (
            <span
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-slate-300"
            >
              {cat}
              <button
                onClick={() => handleRemoveCategory(cat)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder="Add category..."
            className="flex-1 px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-1 px-4 py-2.5 bg-violet-600/30 border border-violet-500/30 rounded-xl text-sm text-violet-300 hover:bg-violet-600/50 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-slate-800/50 rounded-2xl border border-white/5 p-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
          <Save size={18} className="text-emerald-400" />
          Data Management
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white hover:bg-slate-700 transition-colors"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={handleImportData}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white hover:bg-slate-700 transition-colors"
            >
              <Upload size={16} />
              Import Data
            </button>
          </div>
          <div className="p-3 bg-slate-700/20 rounded-lg text-xs text-slate-400">
            <p>📊 {tasks.length} tasks · {sessions.length} sessions stored locally</p>
          </div>
          <div className="pt-2">
            {showResetConfirm ? (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300 flex-1">This will permanently delete all data!</p>
                <button
                  onClick={handleResetData}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-500"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm transition-colors"
              >
                <RotateCcw size={14} />
                Reset All Data
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          checked ? 'bg-violet-600' : 'bg-slate-600'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
