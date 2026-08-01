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
import { MobileChatLayout } from './components/MobileChatLayout';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { AdBanner } from './components/AdBanner';

import { ShieldCheck, User, Filter, Lock, Zap, MessageSquare } from 'lucide-react';

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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Check for hidden /adminpanel route access
  useEffect(() => {
    if (window.location.pathname === '/adminpanel') {
      setIsAdminOpen(true);
    }
  }, []);

  const handleSaveGuestProfile = (nickname: string, gender: string, ageConfirmed: boolean) => {
    updateProfile({
      displayName: nickname,
      gender: gender as any,
      ageVerified: ageConfirmed,
    });
  };

  const handleGoogleAuth = (googleUser: any) => {
    updateProfile({
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      googleUser: googleUser,
      ageVerified: true,
    });
    setIsAuthOpen(false);
  };

  const currentMode = roomInfo?.mode || profile.preferredFilters.mode || 'video';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      
      {/* Navigation Header */}
      <Navbar
        profile={profile}
        onlineCount={onlineCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4">
        
        {/* State 1: IDLE WELCOME & DASHBOARD */}
        {status === 'idle' && (
          <div className="flex-1 flex flex-col gap-6 animate-fadeIn">
            
            {/* Hero Stats & Side-by-Side Video / Text Chat Launcher */}
            <StatsBanner
              onlineCount={onlineCount}
              onStartText={() => startMatchmaking('text')}
              onStartVideo={() => startMatchmaking('video')}
            />

            {/* Top Monetization Leaderboard Ad Banner (Hides if unfilled) */}
            <AdBanner format="banner" className="my-1" />

            {/* Profile & Filters Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Your Local Profile</span>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    id="edit-profile-card-btn"
                    className="text-xs font-bold text-white hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Nickname:</span>
                    <span className="font-bold text-white">{profile.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Gender:</span>
                    <span className="font-medium text-zinc-300 capitalize">{profile.gender}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Country:</span>
                    <span className="font-medium text-zinc-300">{profile.country}</span>
                  </div>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-1.5 font-semibold">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Match Preferences Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <span>Match Filters</span>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    id="edit-filters-card-btn"
                    className="text-xs font-bold text-white hover:underline"
                  >
                    Adjust
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Target Gender:</span>
                    <span className="font-bold text-white capitalize">{profile.preferredFilters.gender}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Location:</span>
                    <span className="font-bold text-white capitalize">{profile.preferredFilters.country}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Common Interests:</span>
                    <span className="font-semibold text-white">
                      {profile.preferredFilters.commonInterests ? 'Enabled' : 'Off'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Fallback Global Search</span>
                  <span className="font-bold text-zinc-300">
                    {profile.preferredFilters.globalSearch ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Community Safety Commitment Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 font-bold text-white text-sm border-b border-zinc-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Privacy & Community Safety</span>
                </div>

                <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                    <span>No database storing messages or personal records.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                    <span>Strict 18+ adult age declaration required.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                    <span>Instant session block & report capabilities.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={() => startMatchmaking('text')}
                    id="quick-start-text-btn"
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
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
            <section className="pt-6 border-t border-zinc-800 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Why StrangerPulse is the Best Random Stranger Chat Platform
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                  StrangerPulse connects millions of people around the globe for free anonymous text and high-definition video chat with smart interest matching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <article className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                    <Zap className="w-4 h-4 text-zinc-400" /> Instant Peer Connection
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Powered by ultra low-latency WebRTC and Socket.IO servers, connect to strangers worldwide in less than 2 seconds.
                  </p>
                </article>

                <article className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                    <Filter className="w-4 h-4 text-zinc-400" /> Smart Interest Matching
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Match with strangers who share your passion for gaming, music, movies, or travel using custom tag filters.
                  </p>
                </article>

                <article className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 shadow-sm">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" /> Zero Log Privacy
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
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
          <div className="flex-1 flex flex-col gap-3 min-h-[480px]">
            
            {/* Mobile Edge-to-Edge Experience Layout (< lg) */}
            <div className="block lg:hidden w-full h-full">
              <MobileChatLayout
                mode={roomInfo.mode}
                localStream={localStream}
                remoteStream={remoteStream}
                partnerProfile={roomInfo.partnerProfile}
                messages={messages}
                isPartnerTyping={isPartnerTyping}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                videoFailed={videoFailed}
                onSendMessage={sendMessage}
                onTyping={notifyTyping}
                onToggleCamera={toggleCamera}
                onToggleMic={toggleMic}
                onSkip={skipStranger}
                onEnd={endChat}
                onReportClick={() => setIsReportOpen(true)}
              />
            </div>

            {/* Desktop Side-by-Side Experience Layout (lg:) */}
            <div className="hidden lg:flex flex-col gap-4 flex-1 h-[calc(100vh-170px)] max-h-[750px] min-h-[480px]">
              <div className={`flex-1 min-h-0 grid gap-4 ${roomInfo.mode === 'video' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
                <ChatBox
                  messages={messages}
                  partnerProfile={roomInfo.partnerProfile}
                  isPartnerTyping={isPartnerTyping}
                  onSendMessage={sendMessage}
                  onTyping={notifyTyping}
                  onReportClick={() => setIsReportOpen(true)}
                />
              </div>

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

          </div>
        )}

      </main>

      {/* Semantic Footer Component with Privacy Policy & AdSense Disclosures */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

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

      {/* Google AdSense Compliant Privacy Policy & Cookie Opt-Out Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

    </div>
  );
}
