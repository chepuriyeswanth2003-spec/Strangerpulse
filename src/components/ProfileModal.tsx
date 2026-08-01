import React, { useState } from 'react';
import { UserProfile, MatchFilters } from '../types';
import { X, User, Filter, Globe, Sparkles, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
}

const POPULAR_INTERESTS = [
  'gaming', 'music', 'movies', 'anime', 'coding', 'crypto', 'travel',
  'fitness', 'art', 'books', 'tech', 'fashion', 'foodie', 'sports'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [gender, setGender] = useState(profile.gender);
  const [country, setCountry] = useState(profile.country);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [newTagInput, setNewTagInput] = useState('');
  
  const [filters, setFilters] = useState<MatchFilters>(profile.preferredFilters);

  const handleToggleTag = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      if (interests.length < 8) {
        setInterests([...interests, tag]);
      }
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && !interests.includes(clean) && interests.length < 8) {
      setInterests([...interests, clean]);
      setNewTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      displayName: displayName.trim() || 'Anonymous',
      gender,
      country,
      interests,
      preferredFilters: filters,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold border border-zinc-800">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Profile &amp; Match Settings</h3>
              <p className="text-xs text-zinc-400">Customize your stranger chat preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Local Profile Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-zinc-400" />
              1. Personal Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Display Name</label>
                <input
                  type="text"
                  maxLength={20}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Your Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="everyone">Non-Binary / Secret</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Interest Tags */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              2. Shared Interests (Max 8)
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {POPULAR_INTERESTS.map((tag) => {
                const active = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Matchmaking Preferences */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-400" />
              3. Stranger Matching Filters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Stranger Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="everyone">Everyone (Fastest Match)</option>
                  <option value="female">Female Only</option>
                  <option value="male">Male Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Default Mode</label>
                <select
                  value={filters.mode}
                  onChange={(e) => setFilters({ ...filters, mode: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="video">Video Chat</option>
                  <option value="text">Text Chat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border border-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-zinc-200 transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Preferences
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
