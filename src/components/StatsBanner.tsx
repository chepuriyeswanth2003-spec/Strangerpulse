import React from 'react';
import { ShieldCheck, Video, MessageSquare, Zap, Lock, Sparkles } from 'lucide-react';

interface StatsBannerProps {
  onlineCount: number;
  onStartText: () => void;
  onStartVideo: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  onlineCount,
  onStartText,
  onStartVideo,
}) => {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden my-4">
      
      {/* Background accents */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-12 -top-12 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Heading & Features */}
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Instant Stranger Matchmaking</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Meet Random Strangers Worldwide in Seconds
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
            Encrypted high quality video & instant text chat. No database storage — your profile stays strictly private on your device.
          </p>

          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-indigo-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 18+ Age Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" /> Private & Anonymous
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" /> Fast Real-Time
            </span>
          </div>
        </div>

        {/* Right: Mode Launch Cards */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          
          <button
            onClick={onStartText}
            id="banner-start-text-btn"
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-3 text-left group shadow-lg active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-white">Text Chat</span>
              <span className="text-[11px] text-indigo-200">Instant Messages</span>
            </div>
          </button>

          <button
            onClick={onStartVideo}
            id="banner-start-video-btn"
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-95 text-white transition-all flex items-center justify-center gap-3 text-left group shadow-xl shadow-indigo-600/30 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-white">Video Chat</span>
              <span className="text-[11px] text-pink-200">Camera & Mic Stream</span>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
};
