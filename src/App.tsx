import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useChat } from './hooks/useChat';

import { Navbar } from './components/Navbar';
import { InitialEntryModal } from './components/InitialEntryModal';
import { ProfileModal } from './components/ProfileModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { MatchmakingOverlay } from './components/MatchmakingOverlay';
import { VideoContainer } from './components/VideoContainer';
import { ChatBox } from './components/ChatBox';
import { ControlBar } from './components/ControlBar';
import { ReportModal } from './components/ReportModal';
import { StatsBanner } from './components/StatsBanner';
import { AdminModal } from './components/AdminModal';
import { AdBanner } from './components/AdBanner';

import { ShieldCheck, User, Sparkles, Filter, Heart, MessageSquare, Video, Lock, Zap } from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme('dark');
  const {
    profile,
    updateProfile,
    status,
    onlineCount,
    roomInfo,
    messages,
    isPartnerTyping,
    elapsedSeconds,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    videoFailed,
    startMatchmaking,
    cancelMatchmaking,
    sendMessage,
    notifyTyping,
    skipStranger,
    endChat,
    toggleCamera,
    toggleMic,
    reportStranger,
    blockStranger,
  } = useChat();

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check for hidden /adminpanel route access
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.endsWith('/adminpanel') || hash === '#adminpanel' || hash === '#/adminpanel') {
        setIsAdminOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  // Keyboard shortcut Esc to skip stranger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status === 'connected' || status === 'searching') {
          skipStranger();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, skipStranger]);

  const handleSaveGuestProfile = (updated: typeof profile) => {
    updateProfile(updated);
  };

  const handleGoogleAuth = (googleUser: { id: string; name: string; picture?: string }) => {
    updateProfile({
      ...profile,
      googleUser,
      displayName: googleUser.name || profile.displayName,
      ageVerified: true,
    });
  };

  const currentMode = profile.preferredFilters.mode || 'text';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        profile={profile}
        onlineCount={onlineCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* State 1: IDLE WELCOME & DASHBOARD */}
        {status === 'idle' && (
          <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
            
            {/* Hero Stats Banner */}
            <StatsBanner
              onlineCount={onlineCount}
              onStartText={() => startMatchmaking('text')}
              onStartVideo={() => startMatchmaking('video')}
            />

            {/* Top Monetization Leaderboard Ad Banner */}
            <AdBanner format="banner" className="my-1" />

            {/* Profile & Filters Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>Your Local Profile</span>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    id="edit-profile-card-btn"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Nickname:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{profile.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Gender:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{profile.gender}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Country:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{profile.country}</span>
                  </div>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-semibold">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Matchmaking Filter Recap Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Filter className="w-4 h-4 text-purple-500" />
                    <span>Matching Filters</span>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    id="edit-filters-card-btn"
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Configure
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Target Gender:</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{profile.preferredFilters.gender}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Location:</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{profile.preferredFilters.country}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Common Interests:</span>
                    <span className="font-semibold text-emerald-500">
                      {profile.preferredFilters.commonInterests ? 'Enabled' : 'Off'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Fallback Global Search</span>
                  <span className="font-bold text-indigo-400">
                    {profile.preferredFilters.globalSearch ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Community Safety Commitment Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Privacy & Community Safety</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>No database storing messages or personal records.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Strict 18+ adult age declaration required.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
                    <span>Instant session block & report capabilities.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={() => startMatchmaking('text')}
                    id="quick-start-text-btn"
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Launch Text Chat Now
                  </button>
                </div>
              </div>

            </div>

            {/* Content Banner Ad */}
            <AdBanner format="banner" className="my-2" />

            {/* Semantic SEO Informational & FAQ Section */}
            <section className="pt-6 border-t border-slate-200 dark:border-slate-800/80 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Why StrangerPulse is the Best Random Stranger Chat Platform
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  StrangerPulse connects millions of people around the globe for free anonymous text and high-definition video chat with smart interest matching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <article className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Instant Peer Connection
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Powered by ultra low-latency WebRTC and Socket.IO servers, connect to strangers worldwide in less than 2 seconds.
                  </p>
                </article>

                <article className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Filter className="w-4 h-4" /> Smart Interest Matching
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Match with people who share your passion for gaming, music, movies, or travel using custom tag filters.
                  </p>
                </article>

                <article className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Zero Log Privacy
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Your chat messages are never saved on any database server. Your profile is stored locally on your device.
                  </p>
                </article>
              </div>
            </section>

          </div>
        )}

        {/* State 2: SEARCHING / MATCHMAKING */}
        {status === 'searching' && (
          <MatchmakingOverlay
            filters={profile.preferredFilters}
            onCancel={cancelMatchmaking}
          />
        )}

        {/* State 3: CONNECTED ACTIVE CHAT */}
        {status === 'connected' && roomInfo && (
          <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
            
            {/* Grid layout depending on Mode */}
            <div className={`flex-1 grid gap-4 ${roomInfo.mode === 'video' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* WebRTC Video Stream Container */}
              {roomInfo.mode === 'video' && (
                <VideoContainer
                  localStream={localStream}
                  remoteStream={remoteStream}
                  partnerProfile={roomInfo.partnerProfile}
                  isVideoEnabled={isVideoEnabled}
                  isAudioEnabled={isAudioEnabled}
                  videoFailed={videoFailed}
                  onToggleCamera={toggleCamera}
                  onToggleMic={toggleMic}
                />
              )}

              {/* Chat Message Box */}
              <ChatBox
                messages={messages}
                partnerProfile={roomInfo.partnerProfile}
                isPartnerTyping={isPartnerTyping}
                onSendMessage={sendMessage}
                onTyping={notifyTyping}
                onReportClick={() => setIsReportOpen(true)}
              />

            </div>

            {/* Bottom Control Action Bar */}
            <ControlBar
              status={status}
              mode={currentMode}
              elapsedSeconds={elapsedSeconds}
              onStartMatch={startMatchmaking}
              onSkip={skipStranger}
              onEnd={endChat}
              onOpenReport={() => setIsReportOpen(true)}
              onBlock={blockStranger}
            />

          </div>
        )}

      </main>

      {/* Semantic Footer for SEO & Metadata */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6 px-4 mt-auto text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
            <span className="p-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black">SP</span>
            <span>StrangerPulse</span>
            <span className="text-[10px] text-slate-400 font-normal">© {new Date().getFullYear()} All Rights Reserved</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="hover:text-indigo-500 cursor-pointer">Random Video Chat</span>
            <span>•</span>
            <span className="hover:text-indigo-500 cursor-pointer">Anonymous Text Chat</span>
            <span>•</span>
            <span className="hover:text-indigo-500 cursor-pointer">Stranger Matching</span>
            <span>•</span>
            <span className="hover:text-indigo-500 cursor-pointer">Privacy & Terms</span>
          </div>

          <div className="text-[10px] text-slate-400">
            Strictly 18+ Adult Community Standard
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* Initial Entry Onboarding Modal */}
      <InitialEntryModal
        isOpen={!profile.ageVerified}
        profile={profile}
        onSaveGuestProfile={handleSaveGuestProfile}
        onOpenGoogleLogin={() => setIsAuthOpen(true)}
      />

      {/* Profile & Filters Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onSave={updateProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Google OAuth Modal */}
      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleGoogleAuth}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmitReport={reportStranger}
      />

      {/* Admin Monitoring Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

    </div>
  );
}
