import React from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Users, Sun, Moon, User, Zap, LogIn } from 'lucide-react';

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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/90 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenProfile}>
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-lg">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white uppercase">
              StrangerPulse
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
              18+ Verified
            </span>
          </div>
        </div>

        {/* Center: Online Users Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Users className="w-3.5 h-3.5 ml-0.5 text-zinc-400" />
          <span>{onlineCount.toLocaleString()} Strangers Online</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            id="theme-toggle-btn"
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-300" />}
          </button>

          {/* Auth Button */}
          {profile.googleUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200">
              <img
                src={profile.googleUser.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover grayscale"
              />
              <span className="max-w-[100px] truncate">{profile.googleUser.name}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              id="google-signin-nav-btn"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-zinc-300" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={onOpenProfile}
            id="open-profile-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{profile.displayName || 'Profile'}</span>
            {profile.ageVerified && <ShieldCheck className="w-3.5 h-3.5 text-black" />}
          </button>

        </div>
      </div>
    </header>
  );
};
