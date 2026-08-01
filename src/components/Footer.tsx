import React from 'react';
import { ShieldCheck, FileText, Lock, Zap } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="w-full border-t border-zinc-800 bg-black/80 backdrop-blur-md py-6 px-4 mt-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        
        {/* Brand Copyright & Age Badge */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold">
            <Zap className="w-3.5 h-3.5 fill-black" />
          </div>
          <div>
            <span className="font-extrabold text-white uppercase tracking-wider">StrangerPulse</span>
            <span className="mx-2">•</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
        </div>

        {/* Links & Policy Modals */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-zinc-300" />
            Privacy Policy & Cookie Opt-Out
          </button>
          
          <button
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-300" />
            AdSense Terms & Disclosures
          </button>

          <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-white" />
            18+ Verified Platform
          </span>
        </div>

      </div>
    </footer>
  );
};
