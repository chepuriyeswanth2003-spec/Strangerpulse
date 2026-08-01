import React from 'react';
import { UserProfile, MatchFilters } from '../types';
import { Sparkles, X, Globe, User, Filter } from 'lucide-react';

interface MatchmakingOverlayProps {
  filters: MatchFilters;
  onCancel: () => void;
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({
  filters,
  onCancel,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden min-h-[480px]">
      
      {/* Black & White Radar Pulse Rings */}
      <div className="relative flex items-center justify-center my-8">
        <div className="absolute w-64 h-64 rounded-full bg-zinc-900/60 border border-zinc-800 animate-ping opacity-25"></div>
        <div className="absolute w-48 h-48 rounded-full bg-zinc-900/80 border border-zinc-700 animate-pulse"></div>
        <div className="relative w-24 h-24 rounded-full bg-white text-black border-4 border-zinc-700 flex items-center justify-center shadow-2xl">
          <Sparkles className="w-10 h-10 fill-black animate-spin" />
        </div>
      </div>

      {/* Title & Searching Status */}
      <div className="text-center space-y-2 z-10 max-w-sm">
        <h3 className="text-xl font-black text-white uppercase tracking-wider">
          Finding Your Stranger...
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Searching global online queue for an available match based on your preferences.
        </p>
      </div>

      {/* Applied Filters Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6 z-10">
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          Gender: <strong className="text-white capitalize">{filters.gender}</strong>
        </span>

        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          Location: <strong className="text-white capitalize">{filters.country}</strong>
        </span>

        {filters.commonInterests && (
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            Shared Interests
          </span>
        )}
      </div>

      {/* Cancel Search Action Button */}
      <button
        onClick={onCancel}
        className="mt-8 px-6 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-800 transition-all flex items-center gap-2 active:scale-95 z-10"
      >
        <X className="w-4 h-4 text-zinc-400" />
        Cancel Search
      </button>

    </div>
  );
};
