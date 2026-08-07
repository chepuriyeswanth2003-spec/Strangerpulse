import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PublicProfile } from '../types';
import {
  Mic,
  MicOff,
  Camera,
  Send,
  Smile,
  SkipForward,
  XCircle,
  ShieldAlert,
  Globe,
  VideoOff,
  User,
  RotateCcw,
} from 'lucide-react';

interface MobileChatLayoutProps {
  mode: 'text' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  partnerProfile: PublicProfile;
  messages: ChatMessage[];
  isPartnerTyping: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  videoFailed?: boolean;
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onReportClick: () => void;
}

const QUICK_REACTIONS = ['Hi!', 'How are you?', 'Thanks!', '👍', '🔥', '👀', '✨'];

export const MobileChatLayout: React.FC<MobileChatLayoutProps> = ({
  mode,
  localStream,
  remoteStream,
  partnerProfile,
  messages,
  isPartnerTyping,
  isVideoEnabled,
  isAudioEnabled,
  videoFailed = false,
  onSendMessage,
  onTyping,
  onToggleCamera,
  onToggleMic,
  onSkip,
  onEnd,
  onReportClick,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isPartnerTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    setShowEmojis(false);
  };

  const handleQuickReaction = (text: string) => {
    onSendMessage(text);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] max-h-[850px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none border border-zinc-800">
      
      {/* 1. BACKGROUND CANVAS */}
      <div className="absolute inset-0 z-0 bg-black">
        {mode === 'video' ? (
          videoFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-zinc-950">
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-zinc-300 flex items-center justify-center border border-zinc-800">
                <VideoOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-base">Video Stream Failed</h4>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Peer camera didn't connect, but text & audio chat are active below!
                </p>
              </div>
            </div>
          ) : remoteStream && remoteStream.getVideoTracks().length > 0 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform-gpu"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
              <div className="w-20 h-20 rounded-full bg-zinc-900 text-zinc-300 flex items-center justify-center border border-zinc-800 animate-pulse mb-3">
                <User className="w-10 h-10" />
              </div>
              <p className="text-white font-bold text-base">{partnerProfile.nickname}</p>
              <p className="text-xs text-zinc-500">Connecting video feed...</p>
            </div>
          )
        ) : (
          /* Black & White Audio Chat Radial Background */
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 via-black to-zinc-950 flex flex-col items-center justify-center relative">
            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center shadow-2xl animate-pulse relative">
              <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center">
                <Mic className="w-9 h-9" />
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-white font-bold text-xs">
                {partnerProfile.nickname} ({partnerProfile.country})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP FLOATING ACTIONS & PIP LOCAL CAMERA */}
      <div className="relative z-10 p-4 flex items-start justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        
        {/* Left Side: Vertical Action Pills */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onEnd}
            className="w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
            title="End Chat"
          >
            <XCircle className="w-5 h-5 text-zinc-400" />
          </button>

          <button
            onClick={onReportClick}
            className="w-9 h-9 rounded-full bg-zinc-900/90 border border-zinc-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
            title="Report Stranger"
          >
            <ShieldAlert className="w-5 h-5 text-zinc-400" />
          </button>

          <div className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-white font-bold text-[10px] flex items-center gap-1">
            <Globe className="w-3 h-3 text-zinc-400" />
            {partnerProfile.country}
          </div>
        </div>

        {/* Right Side: PIP Local Self-Video Circle */}
        {mode === 'video' && (
          <div className="relative flex flex-col items-end">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-zinc-700 shadow-2xl bg-zinc-900 relative">
              {localStream && localStream.getVideoTracks().length > 0 ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100 transform-gpu"
                  style={{ willChange: 'transform', transform: 'scaleX(-1) translateZ(0)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                  Off
                </div>
              )}
            </div>
            
            {/* Camera Flip Button */}
            <button
              onClick={onToggleCamera}
              className="mt-1 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-zinc-800 active:scale-90"
              title="Toggle Camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* 3. FLOATING SPEECH BUBBLES */}
      <div
        ref={chatContainerRef}
        className="relative z-10 flex-1 px-4 py-2 overflow-y-auto space-y-2 flex flex-col justify-end pointer-events-auto"
      >
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div
                key={msg.id}
                className="self-center px-3 py-1 rounded-full bg-black/80 border border-zinc-800 text-zinc-300 text-[11px] font-semibold text-center shadow-md my-1"
              >
                {msg.text}
              </div>
            );
          }

          const isSelf = msg.sender === 'self';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} animate-slideUp`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-xl backdrop-blur-md leading-relaxed ${
                  isSelf
                    ? 'bg-white text-black rounded-br-none'
                    : 'bg-zinc-900/95 text-white rounded-bl-none border border-zinc-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isPartnerTyping && (
          <div className="self-start px-3 py-1.5 rounded-2xl bg-zinc-900 text-white text-xs italic font-medium flex items-center gap-1.5 border border-zinc-800 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]"></span>
            <span>Typing...</span>
          </div>
        )}
      </div>

      {/* 4. QUICK REACTION PILLS BAR */}
      <div className="relative z-10 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-black/60 backdrop-blur-md border-t border-zinc-900">
        {QUICK_REACTIONS.map((item) => (
          <button
            key={item}
            onClick={() => handleQuickReaction(item)}
            className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 shadow-md shrink-0 active:scale-95 transition-transform"
          >
            {item}
          </button>
        ))}
      </div>

      {/* 5. BOTTOM FLOATING INPUT & CONTROL BAR */}
      <div className="relative z-10 p-3 bg-black/90 backdrop-blur-xl border-t border-zinc-800 flex items-center gap-2">
        
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          className="p-2.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 transition-colors shrink-0"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Input Text Form */}
        <form onSubmit={handleSend} className="flex-1 flex items-center gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              } else {
                onTyping(true);
              }
            }}
            placeholder="Type message here..."
            className="w-full px-4 py-2.5 rounded-full bg-zinc-900 text-white placeholder-zinc-500 text-xs border border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-white disabled:opacity-30 text-black shadow-lg shrink-0 active:scale-90 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Mic Toggle Button */}
        <button
          onClick={onToggleMic}
          className={`p-2.5 rounded-full border shrink-0 transition-transform active:scale-90 ${
            isAudioEnabled ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-white text-black'
          }`}
          title="Toggle Mic"
        >
          {isAudioEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
        </button>

        {/* Next Stranger (Skip) Button */}
        <button
          onClick={onSkip}
          className="px-3.5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-xl shrink-0 flex items-center gap-1 active:scale-90 transition-transform"
          title="Next Stranger"
        >
          <SkipForward className="w-4 h-4" />
          <span>Next</span>
        </button>

      </div>

    </div>
  );
};
