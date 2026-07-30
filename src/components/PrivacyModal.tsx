import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Privacy Policy & AdSense Disclosures
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last updated: July 30, 2026 • StrangerPulse Compliance Statement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Google AdSense Cookie & Advertising Disclosure */}
        <div className="space-y-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/40">
          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-indigo-500" />
            1. Google AdSense & Third-Party Advertising
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            StrangerPulse displays advertisements served by <strong>Google AdSense</strong>. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to StrangerPulse and/or other sites on the Internet.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Users may opt out of personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-500"
            >
              Google Ad Settings
            </a>{' '}
            or by opting out of a third-party vendor's use of cookies for personalized advertising by visiting{' '}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-500"
            >
              www.aboutads.info
            </a>.
          </p>
        </div>

        {/* Section 2: Data Collection & Privacy Policy */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-500" />
            2. User Data & Zero Logs Guarantee
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
            <li><strong>No Chat Logs Saved:</strong> Peer-to-peer text chat messages and WebRTC video streams are never stored on any server or database.</li>
            <li><strong>Local Profile Storage:</strong> User preferences, avatars, and nicknames are stored exclusively on your local web browser.</li>
            <li><strong>Safety & Moderation:</strong> Ip hashes are temporarily maintained for active abuse prevention, spam mitigation, and emergency safety reporting.</li>
          </ul>
        </div>

        {/* Section 3: 18+ Age Policy */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-amber-500" />
            3. Age Requirement & Community Guidelines
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            StrangerPulse is strictly intended for users who are <strong>18 years of age or older</strong>. Users are required to affirm their adult age prior to entering chat rooms. Any user engaging in harmful, non-consensual, or illegal conduct is immediately banned.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
