import React, { useState, useEffect } from 'react';
import { MatchFilters } from '../types';
import { Search, X, Compass, Globe, Filter, Sparkles } from 'lucide-react';

interface MatchmakingOverlayProps {
  filters: MatchFilters;
  onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({ filters, onCancel }) => {
  const [secondsWaiting, setSecondsWaiting] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsWaiting((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-white min-h-[500px] relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      
      {/* Background Animated Gradient Pulse */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-purple-950/30 to-slate-900 pointer-events-none"></div>

      {/* Radar Animation */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-72 h-72 rounded-full border border-indigo-500/20 animate-ping opacity-20"></div>
        <div className="absolute w-56 h-56 rounded-full border border-purple-500/30 animate-pulse opacity-40"></div>
        <div className="absolute w-40 h-40 rounded-full border border-pink-500/40"></div>
        
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 z-10 animate-bounce">
          <Compass className="w-12 h-12 animate-spin text-white" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* Searching Status Text */}
      <div className="text-center z-10 max-w-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Scanning Online Queue...</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Looking for a Stranger
        </h2>

        <p className="text-xs text-slate-400">
          Connecting you with someone interesting based on your criteria.
        </p>

        <div className="text-sm font-mono text-indigo-400 font-semibold pt-1">
          Time Searching: {secondsWaiting}s
        </div>
      </div>

      {/* Filters Recap */}
      <div className="z-10 mt-6 flex flex-wrap justify-center gap-2 max-w-lg px-4">
        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-indigo-400" />
          Gender: <strong className="text-white capitalize">{filters.gender}</strong>
        </span>

        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-emerald-400" />
          Location: <strong className="text-white capitalize">{filters.country}</strong>
        </span>

        <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-1.5">
          <Search className="w-3 h-3 text-pink-400" />
          Mode: <strong className="text-white capitalize">{filters.mode} Chat</strong>
        </span>
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        id="cancel-matchmaking-btn"
        className="z-10 mt-8 px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg"
      >
        <X className="w-4 h-4 text-rose-400" />
        Cancel Search
      </button>

    </div>
  );
};
