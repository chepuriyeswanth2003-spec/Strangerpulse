import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string, comment: string) => void;
}

const REPORT_REASONS = [
  'Inappropriate / NSFW Video Behavior',
  'Hate Speech, Harassment, or Abuse',
  'Spam, Bot, or Unwanted Commercial Ad',
  'Underage User Violation (< 18)',
  'Scam, Fraud, or Dangerous Conduct',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  if (!isOpen) return null;

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, comment.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold border border-zinc-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Report Stranger</h3>
              <p className="text-xs text-zinc-400">Help keep StrangerPulse safe</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-white text-black mx-auto flex items-center justify-center shadow-lg">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Thank you for keeping StrangerPulse safe. The stranger has been reported and disconnected.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Select Violation Category</label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'bg-white text-black border-white shadow-sm'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span>{reason}</span>
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Briefly describe what happened..."
                className="w-full p-3 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-600 text-xs outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-zinc-200 transition-all shadow-md"
              >
                Submit Report
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
