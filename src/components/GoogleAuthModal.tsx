import React, { useState } from 'react';
import { LogIn, X, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authenticateWithGoogle } from '../services/auth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: { id: string; name: string; picture?: string }) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [idToken, setIdToken] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    if (!idToken.trim()) {
      setErrorMsg('Please provide a valid Google ID token.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await authenticateWithGoogle(idToken.trim());
      if (result.user) {
        onAuthenticated(result.user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Google token verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-center">
        
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <LogIn className="w-4 h-4" />
            <span>Google Sign In</span>
          </div>
          <button
            onClick={onClose}
            id="close-google-modal-btn"
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Branding */}
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.13C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.63H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.37l3.99-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.99 3.13c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sign in with Google
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticates your account securely using your Google ID Token.
          </p>
        </div>

        {/* Input */}
        <div className="text-left space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Google ID Token
          </label>
          <input
            type="text"
            value={idToken}
            onChange={(e) => setIdToken(e.target.value)}
            placeholder="Paste your Google ID Token..."
            id="google-token-input"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Security Note */}
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-600 dark:text-indigo-300 flex items-center gap-2 text-left">
          <Lock className="w-4 h-4 shrink-0" />
          <span>OAuth JWT session is generated securely without exposing sensitive metadata.</span>
        </div>

        {/* Action */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          id="confirm-google-auth-btn"
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Connecting Google OAuth...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Sign In with Google Account</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
