export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type GenderFilter = 'any' | 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type CountryFilter = 'any' | 'same' | string;

export type LanguageFilter = 'any' | 'same' | string;

export interface UserProfile {
  displayName: string;
  gender: Gender;
  country: string;
  stateRegion?: string;
  languages: string[];
  interests: string[];
  preferredTheme: 'dark' | 'light';
  preferredFilters: MatchFilters;
  ageVerified: boolean;
  googleUser?: {
    id: string;
    name: string;
    picture?: string;
  };
}

export interface PublicProfile {
  nickname: string;
  gender: Gender;
  country: string;
  languages: string[];
  interests: string[];
}

export interface MatchFilters {
  gender: GenderFilter;
  country: CountryFilter;
  language: LanguageFilter;
  commonInterests: boolean;
  globalSearch: boolean;
  mode: 'text' | 'video';
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'stranger' | 'system';
  text: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
}

export interface RoomInfo {
  roomId: string;
  partnerProfile: PublicProfile;
  isInitiator: boolean;
  mode: 'text' | 'video';
}

export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    picture?: string;
  };
}

export interface ReportPayload {
  targetSocketId?: string;
  reason: 'inappropriate_behavior' | 'spam' | 'harassment' | 'underage' | 'other';
  details?: string;
}
