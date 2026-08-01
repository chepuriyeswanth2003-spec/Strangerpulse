import React from 'react';
import { Play, SkipForward, XCircle, Clock, Video, MessageSquare, ShieldAlert, Ban } from 'lucide-react';

interface ControlBarProps {
  status: 'idle' | 'searching' | 'connected';
  mode: 'text' | 'video';
  elapsedSeconds: number;
  onStartMatch: (mode: 'text' | 'video') => void;
  onSkip: () => void;
  onEnd: () => void;
  onOpenReport: () => void;
  onBlock: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status,
  mode,
  elapsedSeconds,
  onStartMatch,
  onSkip,
  onEnd,
  onOpenReport,
  onBlock,
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      
      {/* Left: Mode Selection or Timer */}
      <div className="flex items-center gap-3">
        {status === 'connected' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm font-bold">
            <Clock className="w-4 h-4 text-zinc-300" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        ) : (
          <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => onStartMatch('text')}
              disabled={status === 'searching'}
              id="select-text-mode-btn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'text'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Text Chat
            </button>
            <button
              onClick={() => onStartMatch('video')}
              disabled={status === 'searching'}
              id="select-video-mode-btn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'video'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Chat
            </button>
          </div>
        )}
      </div>

      {/* Middle: Primary Action (Start / Skip / Next Stranger) */}
      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <button
            onClick={() => onStartMatch(mode)}
            id="start-stranger-chat-btn"
            className="px-8 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Chatting
          </button>
        )}

        {(status === 'connected' || status === 'searching') && (
          <button
            onClick={onSkip}
            id="skip-stranger-btn"
            className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <SkipForward className="w-5 h-5" />
            Next Stranger
          </button>
        )}

        {status === 'connected' && (
          <button
            onClick={onEnd}
            id="end-chat-btn"
            className="px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm border border-zinc-800 transition-all flex items-center gap-2 active:scale-95"
          >
            <XCircle className="w-5 h-5 text-zinc-400" />
            End Chat
          </button>
        )}
      </div>

      {/* Right: Safety Options */}
      {status === 'connected' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReport}
            id="report-user-btn"
            className="px-3 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold border border-zinc-800 transition-colors flex items-center gap-1.5"
            title="Report Stranger"
          >
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <button
            onClick={onBlock}
            id="block-user-btn"
            className="px-3 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold border border-zinc-800 transition-colors flex items-center gap-1.5"
            title="Block Stranger for Session"
          >
            <Ban className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Block</span>
          </button>
        </div>
      ) : (
        <div className="text-xs text-zinc-500 font-medium">
          Press <kbd className="px-2 py-1 rounded bg-zinc-900 font-mono border border-zinc-800 text-zinc-400">Esc</kbd> anytime to skip
        </div>
      )}

    </div>
  );
};
