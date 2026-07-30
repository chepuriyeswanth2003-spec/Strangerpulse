import React from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Users, Sun, Moon, User, Sparkles, LogIn, Activity } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile;
  onlineCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onlineCount,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenAuth,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenProfile}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
              StrangerPulse
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              18+ Verified
            </span>
          </div>
        </div>

        {/* Center: Online Users Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Users className="w-3.5 h-3.5 ml-0.5" />
          <span>{onlineCount.toLocaleString()} Strangers Online</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            id="theme-toggle-btn"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Auth Button */}
          {profile.googleUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200">
              <img
                src={profile.googleUser.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="max-w-[100px] truncate">{profile.googleUser.name}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              id="google-signin-nav-btn"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={onOpenProfile}
            id="open-profile-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{profile.displayName || 'Profile'}</span>
            {profile.ageVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
          </button>

        </div>
      </div>
    </header>
  );
};
