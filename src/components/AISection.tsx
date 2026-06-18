import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import { Bot, RefreshCw, Maximize2, ChevronDown } from 'lucide-react';

const CLASS_OPTIONS = [
  '6th', '7th', '8th', '9th', '10th',
  '11th (PCM)', '11th (PCB)', '11th (Commerce)',
  '12th (PCM)', '12th (PCB)', '12th (Commerce)',
  'Graduation', 'Post-Graduation',
];

const LS_CLASS_KEY = 'sf-ai-class';

export default function AISection() {
  const { session } = useAuth();
  const { settings } = useApp();

  const studentName = session?.name ?? 'Student';
  const theme = settings.theme ?? 'dark';

  const [selectedClass, setSelectedClass] = useState<string>(
    () => localStorage.getItem(LS_CLASS_KEY) ?? '10th'
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Persist class choice
  useEffect(() => {
    localStorage.setItem(LS_CLASS_KEY, selectedClass);
    setIsLoading(true);
    setIframeKey(k => k + 1);
  }, [selectedClass]);

  // Reload when student or theme changes
  useEffect(() => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  }, [studentName, theme]);

  const iframeSrc = `https://topperstoolkitai.netlify.app/?name=${encodeURIComponent(studentName)}&class=${encodeURIComponent(selectedClass)}&theme=${theme}`;

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        {/* Brand */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">AI Tutor</h2>
            <span className="flex items-center gap-1 text-[9px] bg-fuchsia-500/15 text-fuchsia-400 px-1.5 py-0.5 rounded-full border border-fuchsia-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              Powered by AI
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            Signed in as <span className="text-slate-300">{studentName}</span>
          </p>
        </div>

        {/* Class selector */}
        <div className="relative flex-shrink-0">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-slate-800/70 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fuchsia-500/50 cursor-pointer hover:border-white/20 transition-colors"
          >
            {CLASS_OPTIONS.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Reload */}
        <button
          onClick={handleReload}
          title="Reload AI Tutor"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex-shrink-0"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-fuchsia-400' : ''} />
        </button>
      </div>

      {/* ── iframe ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#0B0F19]">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0B0F19]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/30 animate-pulse">
              <Bot size={28} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Loading AI Tutor…</p>
              <p className="text-slate-400 text-sm mt-1">
                Connecting as <span className="text-fuchsia-400">{studentName}</span> · Class {selectedClass}
              </p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={iframeSrc}
          title="AI Tutor"
          onLoad={() => setIsLoading(false)}
          className={cn(
            'w-full h-full border-none transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          allow="microphone; camera; clipboard-write"
        />
      </div>
    </div>
  );
}
