import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold border border-zinc-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Privacy Policy & AdSense Disclosures
              </h3>
              <p className="text-xs text-zinc-400">
                Last updated: August 1, 2026 • StrangerPulse Compliance Statement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1 */}
        <div className="space-y-2 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-zinc-300" />
            1. Google AdSense & Third-Party Advertising
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            StrangerPulse displays advertisements served by <strong>Google AdSense</strong>. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites.
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Users may opt out of personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-300"
            >
              Google Ad Settings
            </a>{' '}
            or{' '}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold underline hover:text-zinc-300"
            >
              www.aboutads.info
            </a>.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-zinc-300" />
            2. User Data & Zero Logs Guarantee
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-400 leading-relaxed list-disc list-inside">
            <li><strong>No Chat Logs Saved:</strong> Peer-to-peer text chat messages and WebRTC video streams are never stored on any server.</li>
            <li><strong>Local Profile Storage:</strong> User preferences, avatars, and nicknames stay on your browser.</li>
            <li><strong>Safety & Moderation:</strong> Temporary IP hashes are maintained for active abuse prevention and safety reporting.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-zinc-300" />
            3. Age Requirement & Community Guidelines
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            StrangerPulse is strictly intended for users who are <strong>18 years of age or older</strong>. Users are required to affirm their adult age prior to entering chat rooms.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-zinc-200 transition-all shadow-md"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
