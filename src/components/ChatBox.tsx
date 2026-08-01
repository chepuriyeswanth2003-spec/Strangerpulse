import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PublicProfile } from '../types';
import { Send, Smile, Copy, Check, ShieldAlert, Sparkles, Globe, MessageSquarePlus, RefreshCw, X } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface ChatBoxProps {
  messages: ChatMessage[];
  partnerProfile: PublicProfile | null;
  isPartnerTyping: boolean;
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  onReportClick: () => void;
  isMobileOverlay?: boolean;
  onCloseMobileOverlay?: () => void;
}

const EMOJI_LIST = ['👋', '😊', '😂', '🔥', '❤️', '👍', '🎉', '😎', '🙌', '👀'];

const ICEBREAKER_POOL = [
  "If you could travel anywhere tomorrow, where would you go? ✈️",
  "What's a movie or TV show you can rewatch endlessly? 🍿",
  "What's your go-to comfort food on a cozy day? 🍕",
  "What music artist are you listening to on repeat right now? 🎵",
  "Are you a coffee or tea person? ☕",
  "What's a fun fact about you that usually surprises people? ✨",
  "What's your favorite hobby or passion project right now? 🎨",
  "If you won the lottery today, what's the first thing you'd do? 💰",
  "What's the best book, video game, or podcast you've tried recently? 🎮",
  "What's your ultimate dream vacation spot? 🏖️",
];

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  partnerProfile,
  isPartnerTyping,
  onSendMessage,
  onTyping,
  onReportClick,
  onCloseMobileOverlay,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [dismissedIcebreakers, setDismissedIcebreakers] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Pick 3 random icebreakers when a new stranger connects
  useEffect(() => {
    if (partnerProfile) {
      const shuffled = [...ICEBREAKER_POOL].sort(() => 0.5 - Math.random());
      setIcebreakers(shuffled.slice(0, 3));
      setDismissedIcebreakers(false);
    } else {
      setIcebreakers([]);
    }
  }, [partnerProfile?.nickname]);

  const handleRefreshIcebreakers = () => {
    const shuffled = [...ICEBREAKER_POOL].sort(() => 0.5 - Math.random());
    setIcebreakers(shuffled.slice(0, 3));
  };

  const handleSelectIcebreaker = (question: string) => {
    onSendMessage(question);
    setDismissedIcebreakers(true);
  };

  // Auto-scroll inside chat container
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping(true);
    }
  };

  const handleCopyChat = () => {
    if (messages.length === 0) return;
    const chatText = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender === 'self' ? 'You' : partnerProfile?.nickname || 'Stranger'}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(chatText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-[220px] sm:min-h-[350px] bg-zinc-950 border border-zinc-800 shadow-2xl rounded-3xl overflow-hidden relative">
      
      {/* Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-zinc-800 bg-black/80 flex items-center justify-between">
        {partnerProfile ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center shadow-md">
              {partnerProfile.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs sm:text-sm">
                  {partnerProfile.nickname}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[9px] font-bold border border-zinc-700">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  {partnerProfile.country}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-zinc-300 animate-spin" />
            <span>Waiting to connect with stranger...</span>
          </div>
        )}

        {/* Copy, Report, & Mobile Overlay Close */}
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleCopyChat}
              id="copy-chat-btn"
              className="px-2 py-1.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-semibold border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              title="Copy Chat Log"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {partnerProfile && (
            <button
              onClick={onReportClick}
              id="report-stranger-btn"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Report Stranger"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          {onCloseMobileOverlay && (
            <button
              onClick={onCloseMobileOverlay}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close Floating Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Top Ad Banner Slot (Auto-hides if unfilled) */}
      <div className="px-3 py-1 border-b border-zinc-900 bg-black/50 flex-shrink-0">
        <AdBanner format="banner" />
      </div>

      {/* Message Stream (Strictly scrollable inside flexbox container) */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-3.5">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div
                key={msg.id}
                className="my-3 mx-auto max-w-sm px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-semibold text-zinc-300 shadow-sm"
              >
                {msg.text}
              </div>
            );
          }

          const isSelf = msg.sender === 'self';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-md leading-relaxed ${
                  isSelf
                    ? 'bg-white text-black rounded-br-none'
                    : 'bg-zinc-900 text-white rounded-bl-none border border-zinc-800'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs italic pl-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>Stranger is typing...</span>
          </div>
        )}
      </div>

      {/* Icebreaker Questions Bar */}
      {partnerProfile && !dismissedIcebreakers && icebreakers.length > 0 && (
        <div className="px-4 py-2.5 bg-zinc-900 border-t border-b border-zinc-800 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquarePlus className="w-3.5 h-3.5 text-white" />
              Icebreaker Questions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshIcebreakers}
                id="refresh-icebreakers-btn"
                className="p-1 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold"
                title="Get new icebreaker ideas"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedIcebreakers(true)}
                className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {icebreakers.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectIcebreaker(q)}
                id={`icebreaker-btn-${idx}`}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-black text-zinc-200 border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800 transition-all text-left shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 z-20 p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl flex flex-wrap gap-2 max-w-[240px]">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText((prev) => prev + emoji)}
              className="text-lg hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 border-t border-zinc-800 bg-black/60 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          id="emoji-picker-btn"
          className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!partnerProfile}
          id="chat-message-input"
          placeholder={partnerProfile ? 'Type a message to stranger... (Press Enter)' : 'Connect to a stranger to start chatting...'}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 focus:ring-2 focus:ring-zinc-400 text-sm outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || !partnerProfile}
          id="send-message-btn"
          className="p-2.5 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-extrabold transition-all shadow-md active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
};
