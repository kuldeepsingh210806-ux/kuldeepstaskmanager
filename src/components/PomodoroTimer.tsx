import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Coffee, BookOpen } from 'lucide-react';
import type { TimerMode } from '../types';

export default function PomodoroTimer() {
  const { settings, addSession } = useApp();
  const { timer } = settings;

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(timer.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [category, setCategory] = useState(settings.categories[0] || 'General');
  const [totalStudied, setTotalStudied] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(timer.soundEnabled);
  const startTimeRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'work': return timer.workDuration * 60;
      case 'short-break': return timer.shortBreakDuration * 60;
      case 'long-break': return timer.longBreakDuration * 60;
    }
  }, [timer]);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 300);
    } catch {}
  }, [soundEnabled]);

  const completeSession = useCallback(() => {
    playSound();
    const duration = getDuration(mode);

    if (mode === 'work') {
      addSession({
        category,
        startTime: startTimeRef.current || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration,
        type: 'work',
        completed: true,
      });
      setTotalStudied(prev => prev + duration);
      const newCount = sessionCount + 1;
      setSessionCount(newCount);

      if (newCount % timer.sessionsBeforeLongBreak === 0) {
        setMode('long-break');
        setTimeLeft(timer.longBreakDuration * 60);
      } else {
        setMode('short-break');
        setTimeLeft(timer.shortBreakDuration * 60);
      }

      if (timer.autoStartBreaks) {
        setIsRunning(true);
        startTimeRef.current = new Date().toISOString();
      } else {
        setIsRunning(false);
      }
    } else {
      setMode('work');
      setTimeLeft(timer.workDuration * 60);

      if (timer.autoStartWork) {
        setIsRunning(true);
        startTimeRef.current = new Date().toISOString();
      } else {
        setIsRunning(false);
      }
    }
  }, [mode, sessionCount, timer, category, addSession, getDuration, playSound]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, completeSession]);

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = new Date().toISOString();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
    startTimeRef.current = null;
  };

  const skipToNext = () => {
    setIsRunning(false);
    if (mode === 'work') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      if (newCount % timer.sessionsBeforeLongBreak === 0) {
        setMode('long-break');
        setTimeLeft(timer.longBreakDuration * 60);
      } else {
        setMode('short-break');
        setTimeLeft(timer.shortBreakDuration * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(timer.workDuration * 60);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalDuration = getDuration(mode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const modeConfig = {
    work: { label: 'Focus Time', color: 'from-violet-500 to-indigo-500', bgColor: 'bg-violet-500', icon: <BookOpen size={20} /> },
    'short-break': { label: 'Short Break', color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500', icon: <Coffee size={20} /> },
    'long-break': { label: 'Long Break', color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-500', icon: <Coffee size={20} /> },
  };

  const currentConfig = modeConfig[mode];

  // Circular progress
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Study Timer</h1>
        <p className="text-slate-400 mt-1">Stay focused with Pomodoro technique</p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-white/5">
        {([['work', 'Focus'], ['short-break', 'Short Break'], ['long-break', 'Long Break']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mode === m
                ? `bg-gradient-to-r ${modeConfig[m].color} text-white shadow-lg`
                : 'text-slate-400 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category Select */}
      {mode === 'work' && (
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {/* Timer Circle */}
      <div className="relative">
        <svg width="320" height="320" className="transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {mode === 'work' && (
                <>
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </>
              )}
              {mode === 'short-break' && (
                <>
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </>
              )}
              {mode === 'long-break' && (
                <>
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br', currentConfig.color)}>
            {currentConfig.icon}
          </div>
          <span className="text-5xl md:text-6xl font-bold text-white font-mono tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-sm text-slate-400 mt-2">{currentConfig.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={toggleTimer}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105',
            `bg-gradient-to-br ${currentConfig.color}`
          )}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button
          onClick={skipToNext}
          className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
          soundEnabled ? 'text-violet-300 bg-violet-500/10' : 'text-slate-500 bg-slate-800/50'
        )}
      >
        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        Sound {soundEnabled ? 'On' : 'Off'}
      </button>

      {/* Session Info */}
      <div className="w-full grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-white">{sessionCount}</p>
          <p className="text-xs text-slate-400 mt-1">Sessions</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-white">{Math.round(totalStudied / 60)}</p>
          <p className="text-xs text-slate-400 mt-1">Minutes</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {sessionCount > 0
              ? `${timer.sessionsBeforeLongBreak - (sessionCount % timer.sessionsBeforeLongBreak)}`
              : timer.sessionsBeforeLongBreak}
          </p>
          <p className="text-xs text-slate-400 mt-1">Until Long Break</p>
        </div>
      </div>

      {/* Session Dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: timer.sessionsBeforeLongBreak }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              i < (sessionCount % timer.sessionsBeforeLongBreak)
                ? `bg-gradient-to-br ${currentConfig.color}`
                : 'bg-slate-700'
            )}
          />
        ))}
      </div>
    </div>
  );
}
