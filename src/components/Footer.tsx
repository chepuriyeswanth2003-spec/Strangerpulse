import React from 'react';
import { Sparkles, ShieldCheck, Heart, FileText, Lock } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md py-6 px-4 mt-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        
        {/* Brand Copyright & Age Badge */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">StrangerPulse</span>
            <span className="mx-2">•</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
        </div>

        {/* Links & Policy Modals */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            Privacy Policy & Cookie Opt-Out
          </button>
          
          <button
            onClick={onOpenPrivacy}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            AdSense Terms & Disclosures
          </button>

          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            18+ Verified Platform
          </span>
        </div>

      </div>
    </footer>
  );
};
