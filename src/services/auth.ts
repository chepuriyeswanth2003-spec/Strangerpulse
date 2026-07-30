import { AuthState } from '../types';

const TOKEN_KEY = 'stranger_chat_jwt_token';

export async function authenticateWithGoogle(idToken: string): Promise<AuthState> {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Google OAuth token verification failed');
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Invalid response from server');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  return {
    isAuthenticated: true,
    token: data.token,
    user: data.user,
  };
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const AGE_CONSENT_KEY = 'stranger_chat_age_consent';
export const CURRENT_POLICY_VERSION = 'v1.0';

export interface AgeConsentRecord {
  confirmed: boolean;
  consentedAt: string;
  policyVersion: string;
}

export function recordAgeConsent(): void {
  const record: AgeConsentRecord = {
    confirmed: true,
    consentedAt: new Date().toISOString(),
    policyVersion: CURRENT_POLICY_VERSION,
  };
  localStorage.setItem(AGE_CONSENT_KEY, JSON.stringify(record));
}

export function isAgeConsentValid(): boolean {
  try {
    const raw = localStorage.getItem(AGE_CONSENT_KEY);
    if (!raw) return false;
    const record: AgeConsentRecord = JSON.parse(raw);
    return Boolean(record.confirmed && record.policyVersion === CURRENT_POLICY_VERSION);
  } catch {
    return false;
  }
}

