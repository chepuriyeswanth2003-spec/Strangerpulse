import React, { useEffect, useState } from 'react';
import { X, LogIn, ShieldCheck, Sparkles } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: any) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Load Google Identity Services script
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSignIn();
      document.body.appendChild(script);
    } else {
      initGoogleSignIn();
    }
  }, [isOpen]);

  const initGoogleSignIn = () => {
    // @ts-ignore
    if (window.google && window.google.accounts) {
      const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1080874348037-placeholder.apps.googleusercontent.com';

      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      // Render custom Google button into div
      const container = document.getElementById('google-btn-container');
      if (container) {
        // @ts-ignore
        window.google.accounts.id.renderButton(container, {
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });
      }
    }
  };

  const handleCredentialResponse = (response: any) => {
    try {
      // Decode JWT token payload
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      onAuthenticated(payload);
    } catch (err) {
      console.error('Error decoding Google Auth response:', err);
      setAuthError('Authentication failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google Sign In</h3>
              <p className="text-xs text-zinc-400">Keep your verified avatar & nickname</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
            <span>Verified Member Badge</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Signing in with Google unlocks custom avatar display, preferred matching filters, and priority matching queue without saving chat logs.
          </p>
        </div>

        {/* Google Render Container */}
        <div className="flex flex-col items-center justify-center py-3 space-y-3">
          <div id="google-btn-container" className="flex justify-center min-h-[44px]"></div>
          
          {authError && (
            <p className="text-xs text-zinc-300 font-semibold text-center">{authError}</p>
          )}
        </div>

        {/* Guest Fallback */}
        <div className="pt-2 text-center border-t border-zinc-800">
          <button
            onClick={onClose}
            className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Continue as Guest Stranger
          </button>
        </div>

      </div>
    </div>
  );
};
