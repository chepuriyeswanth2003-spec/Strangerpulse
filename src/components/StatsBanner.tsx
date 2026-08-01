import React from 'react';
import { Users, Shield, Zap } from 'lucide-react';

interface StatsBannerProps {
  onlineCount: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ onlineCount }) => {
  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        
        {/* Stat 1 */}
        <div className="flex flex-col items-center justify-center p-2 space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            {onlineCount.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            Active Strangers Online
          </div>
        </div>

        {/* Stat 2 */}
        <div className="flex flex-col items-center justify-center p-2 space-y-1.5 pt-4 md:pt-2">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            Instant 1-2s
          </div>
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            HD Stranger Video Match
          </div>
        </div>

        {/* Stat 3 */}
        <div className="flex flex-col items-center justify-center p-2 space-y-1.5 pt-4 md:pt-2">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black tracking-tight text-white">
            100% Private
          </div>
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            Zero Chat Logs Saved
          </div>
        </div>

      </div>
    </div>
  );
};
