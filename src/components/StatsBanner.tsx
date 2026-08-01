import React from 'react';
import { Users, Shield, Zap, Video, MessageSquare, Play, Sparkles } from 'lucide-react';

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
    <div className="w-full space-y-6">
      
      {/* TWO PROMINENT BIG HERO BLOCKS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* 1. VIDEO CHAT HERO BLOCK */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-white/20 hover:border-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Video className="w-32 h-32 text-white" />
          </div>

          <div className="space-y-3 z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold shadow-lg">
                <Video className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-xs border border-white/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                HD 1080p Stream
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Random Video Chat
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
                Connect face-to-face instantly with random strangers worldwide in 1-2s with full HD video quality and audio filters.
              </p>
            </div>
          </div>

          <div className="z-10 pt-2">
            <button
              onClick={onStartVideo}
              id="hero-start-video-btn"
              className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-sm uppercase tracking-wider shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-95 group-hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Video Chat Now</span>
            </button>
          </div>
        </div>

        {/* 2. TEXT CHAT HERO BLOCK */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-zinc-800 hover:border-zinc-500 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 group transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-32 h-32 text-white" />
          </div>

          <div className="space-y-3 z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold shadow-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 font-bold text-xs border border-zinc-800">
                100% Anonymous
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Anonymous Text Chat
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
                Instant real-time text messaging with strangers. Match by shared interest tags, country, and gender filters.
              </p>
            </div>
          </div>

          <div className="z-10 pt-2">
            <button
              onClick={onStartText}
              id="hero-start-text-btn"
              className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-sm uppercase tracking-wider border border-zinc-700 shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 group-hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Text Chat Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* STATS BANNER BAR */}
      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          
          <div className="flex flex-col items-center justify-center p-2 space-y-1">
            <div className="flex items-center gap-2 text-white font-black text-xl">
              <Users className="w-5 h-5 text-zinc-400" />
              <span>{onlineCount.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              Active Strangers Online
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 space-y-1 pt-3 md:pt-1">
            <div className="flex items-center gap-2 text-white font-black text-xl">
              <Zap className="w-5 h-5 text-zinc-400" />
              <span>Instant 1-2s</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              HD Video Matching Speed
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 space-y-1 pt-3 md:pt-1">
            <div className="flex items-center gap-2 text-white font-black text-xl">
              <Shield className="w-5 h-5 text-zinc-400" />
              <span>Zero Logs Saved</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              100% P2P Encrypted Privacy
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
