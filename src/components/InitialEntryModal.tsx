import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { Sparkles, LogIn, User, ShieldCheck, CheckCircle2, Globe, Heart } from 'lucide-react';
import { recordAgeConsent } from '../services/auth';

interface InitialEntryModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSaveGuestProfile: (updated: UserProfile) => void;
  onOpenGoogleLogin: () => void;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const POPULAR_COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'India', 'Japan', 'Brazil', 'Spain', 'Italy', 'Mexico',
  'South Korea', 'Netherlands', 'Singapore', 'Sweden', 'Philippines'
];

const PRESET_INTERESTS = [
  'Gaming', 'Music', 'Movies', 'Anime', 'Coding', 'Art',
  'Fitness', 'Travel', 'Crypto', 'Books', 'Food'
];

export const InitialEntryModal: React.FC<InitialEntryModalProps> = ({
  isOpen,
  profile,
  onSaveGuestProfile,
  onOpenGoogleLogin,
}) => {
  const [entryMode, setEntryMode] = useState<'choose' | 'guest'>('choose');

  // Guest details state
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [gender, setGender] = useState<Gender>(profile.gender || 'prefer-not-to-say');
  const [country, setCountry] = useState(profile.country || 'United States');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || ['Gaming', 'Music']);
  const [is18Confirmed, setIs18Confirmed] = useState(profile.ageVerified || false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, tag]);
      }
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your nickname to continue.');
      return;
    }
    if (!is18Confirmed) {
      setError('You must confirm that you are 18 years of age or older to enter.');
      return;
    }

    recordAgeConsent();

    const updatedProfile: UserProfile = {
      ...profile,
      displayName: displayName.trim(),
      gender,
      country,
      interests: selectedInterests,
      ageVerified: true,
    };

    onSaveGuestProfile(updatedProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Welcome to StrangerPulse
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Choose how you would like to join. Sign in with your account or continue as a guest stranger.
          </p>
        </div>

        {/* Choice Screen vs Guest Form */}
        {entryMode === 'choose' ? (
          <div className="space-y-4 pt-2">
            
            {/* Login Option */}
            <button
              onClick={() => {
                onOpenGoogleLogin();
              }}
              id="initial-login-option-btn"
              className="w-full p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 text-white">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Sign In with Account</span>
                  <span className="text-[11px] text-indigo-200 font-normal">Fast, secure sign in & profile setup</span>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] font-semibold text-slate-400">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Guest Option */}
            <button
              onClick={() => setEntryMode('guest')}
              id="initial-guest-option-btn"
              className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Continue as Guest</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Quick setup without signing in</span>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                Fill Details &rarr;
              </span>
            </button>

            {/* Privacy notice */}
            <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Strict 18+ adult verification required for all visitors.</span>
            </div>

          </div>
        ) : (
          /* Guest Details Form */
          <form onSubmit={handleGuestSubmit} className="space-y-4 pt-1 text-left animate-fadeIn">
            
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guest Nickname
              </label>
              <input
                type="text"
                maxLength={25}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex, Stranger42"
                id="guest-nickname-input"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Gender & Country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  id="guest-gender-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-500" /> Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  id="guest-country-select"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-500" /> Select Interests Tag ({selectedInterests.length}/5)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_INTERESTS.map((tag) => {
                  const isSel = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Verification Checkbox */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={is18Confirmed}
                  onChange={(e) => {
                    setIs18Confirmed(e.target.checked);
                    setError(null);
                  }}
                  id="guest-age-checkbox"
                  className="w-4 h-4 mt-0.5 text-indigo-600 rounded focus:ring-indigo-500 shrink-0"
                />
                <span className="text-amber-800 dark:text-amber-200 font-semibold leading-tight">
                  I confirm that I am at least 18 years of age and agree to community safety guidelines.
                </span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntryMode('choose')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                id="submit-guest-details-btn"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all text-center"
              >
                Start Chatting as Guest &rarr;
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
