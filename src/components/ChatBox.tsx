import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PublicProfile } from '../types';
import { Send, Smile, Copy, Check, ShieldAlert, Sparkles, Globe, Heart, MessageSquarePlus, RefreshCw, X } from 'lucide-react';
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
  isMobileOverlay = false,
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

  // Auto-scroll inside chat container ONLY (prevents mobile page scrolling to bottom)
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
    const chatText = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n');

    navigator.clipboard.writeText(chatText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-[220px] sm:min-h-[350px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden relative">
      
      {/* Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
        {partnerProfile ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {partnerProfile.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {partnerProfile.nickname}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold border border-emerald-500/20">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  {partnerProfile.country}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>Waiting to connect with stranger...</span>
          </div>
        )}

        {/* Copy, Report, & Mobile Overlay Close */}
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleCopyChat}
              id="copy-chat-btn"
              className="px-2 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              title="Copy Chat Log"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {partnerProfile && (
            <button
              onClick={onReportClick}
              id="report-stranger-btn"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Report Stranger"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          {onCloseMobileOverlay && (
            <button
              onClick={onCloseMobileOverlay}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Floating Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Persistent Top Ad Banner Slot (Fixed, outside scrollable region) */}
      <div className="px-3 py-1 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
        <AdBanner format="banner" />
      </div>

      {/* Message Stream */}
      <div ref={chatContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div
                key={msg.id}
                className="my-3 mx-auto max-w-sm px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm"
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
                className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                  isSelf
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 font-mono px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>Stranger is typing...</span>
          </div>
        )}
      </div>

      {/* Icebreaker Questions Bar (Appears when connected to stranger and not dismissed) */}
      {partnerProfile && !dismissedIcebreakers && icebreakers.length > 0 && (
        <div className="px-4 py-2.5 bg-indigo-500/10 dark:bg-indigo-950/40 border-t border-b border-indigo-500/20 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-500" />
              Icebreaker Questions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshIcebreakers}
                id="refresh-icebreakers-btn"
                className="p-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                title="Get new icebreaker ideas"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedIcebreakers(true)}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-left shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 z-20 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-wrap gap-2 max-w-[240px]">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emoji);
              }}
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
        className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          id="emoji-picker-btn"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || !partnerProfile}
          id="send-message-btn"
          className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
};
