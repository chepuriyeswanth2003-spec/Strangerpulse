import React, { useState } from 'react';
import { UserProfile, Gender, MatchFilters } from '../types';
import { X, User, Globe, Languages as LangIcon, Heart, Filter, ShieldCheck, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
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

const POPULAR_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Hindi',
  'Japanese', 'Korean', 'Mandarin', 'Portuguese', 'Russian', 'Italian'
];

const PRESET_INTERESTS = [
  'Gaming', 'Music', 'Movies', 'Anime', 'Coding', 'Art',
  'Fitness', 'Travel', 'Crypto', 'Books', 'Food', 'Photography', 'Technology'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || 'Friendly Stranger');
  const [gender, setGender] = useState<Gender>(profile.gender || 'prefer-not-to-say');
  const [country, setCountry] = useState(profile.country || 'United States');
  const [stateRegion, setStateRegion] = useState(profile.stateRegion || '');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(profile.languages || ['English']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || ['Gaming', 'Music']);
  const [customInterest, setCustomInterest] = useState('');

  // Matching filters
  const [filters, setFilters] = useState<MatchFilters>(profile.preferredFilters || {
    gender: 'any',
    country: 'any',
    language: 'any',
    commonInterests: false,
    globalSearch: true,
    mode: 'text',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'filters'>('profile');

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      if (selectedLangs.length > 1) {
        setSelectedLangs(selectedLangs.filter((l) => l !== lang));
      }
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customInterest.trim();
    if (tag && !selectedInterests.includes(tag) && selectedInterests.length < 10) {
      setSelectedInterests([...selectedInterests, tag]);
      setCustomInterest('');
    }
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...profile,
      displayName: displayName.trim() || 'Friendly Stranger',
      gender,
      country,
      stateRegion,
      languages: selectedLangs,
      interests: selectedInterests,
      preferredFilters: filters,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Your Profile & Match Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stored locally in browser. Only public tags shared with strangers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-profile-modal-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            id="profile-tab-btn"
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Public Profile
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            id="filters-tab-btn"
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'filters'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Matchmaking Filters
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'profile' ? (
            <>
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Nickname (Visible to Strangers)
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  id="display-name-input"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                  placeholder="e.g. Alex, CyberGamer, FriendlyStranger"
                />
              </div>

              {/* Gender & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    id="gender-select"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    id="country-select"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* State/Region (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  State / Region (Optional)
                </label>
                <input
                  type="text"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  id="state-region-input"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                  placeholder="e.g. California, Bavaria, Tokyo"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <LangIcon className="w-3.5 h-3.5 text-indigo-500" /> Spoken Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANGUAGES.map((lang) => {
                    const isSelected = selectedLangs.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {lang} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-pink-500" /> Topics & Interests ({selectedInterests.length}/10)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        #{interest}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={addCustomInterest} className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    id="custom-interest-input"
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add custom interest..."
                  />
                  <button
                    type="submit"
                    id="add-interest-btn"
                    className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Filters Tab */
            <div className="space-y-6">
              
              {/* Gender Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Preferred Partner Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'any', label: 'Any Gender' },
                    { id: 'male', label: 'Male Only' },
                    { id: 'female', label: 'Female Only' },
                    { id: 'non-binary', label: 'Non-binary' },
                    { id: 'prefer-not-to-say', label: 'Prefer not to say' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilters({ ...filters, gender: opt.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                        filters.gender === opt.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Location Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, country: 'any' })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left ${
                      filters.country === 'any'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🌐 Global (Any Country)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, country: 'same' })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left ${
                      filters.country === 'same'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    📍 Same Country ({country})
                  </button>
                </div>
              </div>

              {/* Common Interests Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Prioritize Common Interests
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Match with strangers sharing at least 1 interest tag.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.commonInterests}
                    onChange={(e) => setFilters({ ...filters, commonInterests: e.target.checked })}
                    id="common-interests-checkbox"
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Global Fallback Search
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      If strict filters timeout, auto-connect to any available stranger.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.globalSearch}
                    onChange={(e) => setFilters({ ...filters, globalSearch: e.target.checked })}
                    id="global-search-checkbox"
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Age Verified (18+)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              id="save-profile-btn"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
