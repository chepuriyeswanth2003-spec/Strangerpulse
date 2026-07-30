import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { recordAgeConsent } from '../services/auth';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ isOpen, onVerify }) => {
  const [declaredAdult, setDeclaredAdult] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!declaredAdult) return;
    recordAgeConsent();
    onVerify();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            18+ Age Affirmation Required
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            StrangerPulse is strictly restricted to adults aged 18 and older. Please confirm your age and consent to continue.
          </p>
        </div>

        {/* Checkbox */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declaredAdult}
              onChange={(e) => setDeclaredAdult(e.target.checked)}
              id="age-confirm-checkbox"
              className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 shrink-0"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              I confirm that I am 18 years of age or older and agree to the Terms of Service and Community Safety Rules.
            </span>
          </label>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 justify-center">
          <Lock className="w-3.5 h-3.5" />
          <span>Your age consent choice is saved locally on your device only.</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={!declaredAdult}
          id="verify-age-submit-btn"
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5" />
          Confirm & Enter Chat
        </button>

      </div>
    </div>
  );
};

