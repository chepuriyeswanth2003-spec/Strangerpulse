import { UserProfile, MatchFilters } from '../types';
import { isAgeConsentValid } from './auth';

const STORAGE_KEY = 'stranger_chat_user_profile_v1';
const BLOCKED_USERS_KEY = 'stranger_chat_blocked_session_v1';

export const DEFAULT_FILTERS: MatchFilters = {
  gender: 'any',
  country: 'any',
  language: 'any',
  commonInterests: false,
  globalSearch: true,
  mode: 'text',
};

export const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  gender: 'prefer-not-to-say',
  country: 'United States',
  stateRegion: '',
  languages: ['English'],
  interests: ['Gaming', 'Music', 'Movies', 'Tech'],
  preferredTheme: 'dark',
  preferredFilters: DEFAULT_FILTERS,
  ageVerified: false,
};

export function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const validConsent = isAgeConsentValid();
    if (!raw) {
      return {
        ...DEFAULT_PROFILE,
        ageVerified: validConsent,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      ageVerified: validConsent,
      preferredFilters: {
        ...DEFAULT_FILTERS,
        ...(parsed.preferredFilters || {}),
      },
    };
  } catch (e) {
    console.error('Failed to parse local storage profile', e);
    return null;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to local storage', e);
  }
}

export function clearStoredProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear profile', e);
  }
}

export function getBlockedUsers(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addBlockedUser(userId: string): void {
  try {
    const list = getBlockedUsers();
    if (!list.includes(userId)) {
      list.push(userId);
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to block user', e);
  }
}
