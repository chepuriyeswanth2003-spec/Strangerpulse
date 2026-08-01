import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, LogIn, Sparkles, CheckCircle2, User } from 'lucide-react';

interface InitialEntryModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSaveGuestProfile: (nickname: string, gender: string, ageConfirmed: boolean) => void;
  onOpenGoogleLogin: () => void;
}

const NICKNAME_ADJECTIVES = ['Cool', 'Silent', 'Mystic', 'Neon', 'Shadow', 'Cosmic', 'Solar', 'Velvet', 'Midnight', 'Hyper'];
const NICKNAME_NOUNS = ['Runner', 'Wanderer', 'Pulse', 'Echo', 'Phoenix', 'Voyager', 'Nomad', 'Spark', 'Phantom', 'Ghost'];

export const InitialEntryModal: React.FC<InitialEntryModalProps> = ({
  isOpen,
  profile,
  onSaveGuestProfile,
  onOpenGoogleLogin,
}) => {
  if (!isOpen) return null;

  const [nickname, setNickname] = useState(() => {
    if (profile.nickname) return profile.nickname;
    const adj = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
    const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
    const num = Math.floor(Math.random() * 90 + 10);
    return `${adj}${noun}${num}`;
  });

  const [gender, setGender] = useState<'everyone' | 'male' | 'female'>(profile.gender || 'everyone');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRandomize = () => {
    const adj = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
    const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
    const num = Math.floor(Math.random() * 90 + 10);
    setNickname(`${adj}${noun}${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setErrorMsg('You must confirm you are 18 years or older to proceed.');
      return;
    }
    if (!nickname.trim()) {
      setErrorMsg('Please enter a display nickname.');
      return;
    }
    setErrorMsg('');
    onSaveGuestProfile(nickname.trim(), gender, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl">
            <Sparkles className="w-7 h-7 fill-black" />
          </div>
          <h2 className="text-2xl font-black tracking-wider uppercase text-white">
            Welcome to StrangerPulse
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Free anonymous live video and text chat with random strangers worldwide.
          </p>
        </div>

        {/* Google Sign In Quick Option */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-center">
          <p className="text-xs text-zinc-300 font-semibold">
            Want to keep your verified profile & avatar?
          </p>
          <button
            type="button"
            onClick={onOpenGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-black" />
            <span>Continue with Google Sign-In</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">or Quick Guest Entry</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Guest Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Your Nickname</span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-[11px] text-zinc-400 hover:text-white font-semibold underline"
              >
                Randomize 🎲
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname..."
                className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-zinc-400 text-sm font-semibold outline-none"
              />
              <User className="absolute right-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            </div>
          </div>

          {/* Gender Filter Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">Your Identity</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'everyone', label: 'Everyone' },
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    gender === g.id
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Affirmation Checkbox */}
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-black focus:ring-white"
              />
              <span className="text-xs text-zinc-300 font-medium leading-tight">
                I confirm I am at least <strong>18 years of age or older</strong> and agree to community standards.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs font-semibold text-center animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>Enter StrangerPulse Chat</span>
          </button>
        </form>

      </div>
    </div>
  );
};
