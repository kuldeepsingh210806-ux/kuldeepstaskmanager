import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';
import { Layers, RefreshCw } from 'lucide-react';

export default function FlashcardSection() {
  const { settings } = useApp();
  const theme = settings.theme ?? 'dark';
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const src = `https://flashcardaigen.netlify.app/?theme=${theme}`;

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
          <Layers size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">AI Flashcards</h2>
            <span className="flex items-center gap-1 text-[9px] bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Powered by AI
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Generate &amp; study smart flashcards instantly</p>
        </div>

        <button
          onClick={handleReload}
          title="Reload Flashcards"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex-shrink-0"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
        </button>
      </div>

      {/* ── iframe ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#0B0F19]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#0B0F19]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
              <Layers size={28} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Loading AI Flashcards…</p>
              <p className="text-slate-400 text-sm mt-1">Preparing your smart study cards</p>
            </div>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={src}
          title="AI Flashcards"
          onLoad={() => setIsLoading(false)}
          className={cn(
            'w-full h-full border-none transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
