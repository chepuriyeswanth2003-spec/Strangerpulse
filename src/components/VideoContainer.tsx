import React, { useRef, useEffect, useState } from 'react';
import { PublicProfile } from '../types';
import { Camera, CameraOff, Mic, MicOff, Maximize, Globe, User, Heart, Sparkles } from 'lucide-react';

interface VideoContainerProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  partnerProfile: PublicProfile;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({
  localStream,
  remoteStream,
  partnerProfile,
  isVideoEnabled,
  isAudioEnabled,
  onToggleCamera,
  onToggleMic,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between group"
    >
      
      {/* Remote Video (Stranger) */}
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
        {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <User className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-base">{partnerProfile.nickname}</p>
              <p className="text-xs text-slate-400">Camera is off or connecting video feed...</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Overlay: Stranger Profile Info */}
      <div className="relative z-10 p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent flex items-start justify-between">
        <div className="flex flex-col gap-1.5 max-w-[70%]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {partnerProfile.nickname}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              {partnerProfile.country}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {partnerProfile.interests?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 border border-purple-500/30 text-[10px] font-medium flex items-center gap-1"
              >
                <Heart className="w-2.5 h-2.5" /> #{tag}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          id="fullscreen-video-btn"
          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md transition-all"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Controls & PIP Local Self-Video */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-end justify-between">
        
        {/* Media Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCamera}
            id="toggle-camera-btn"
            className={`p-3 rounded-2xl backdrop-blur-md border font-semibold text-xs transition-all flex items-center gap-2 ${
              isVideoEnabled
                ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700'
                : 'bg-rose-600/90 border-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {isVideoEnabled ? <Camera className="w-4 h-4 text-emerald-400" /> : <CameraOff className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={onToggleMic}
            id="toggle-mic-btn"
            className={`p-3 rounded-2xl backdrop-blur-md border font-semibold text-xs transition-all flex items-center gap-2 ${
              isAudioEnabled
                ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700'
                : 'bg-rose-600/90 border-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Local PIP Video */}
        <div className="w-28 sm:w-36 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-xl relative group-hover:scale-105 transition-transform">
          {localStream && localStream.getVideoTracks().length > 0 ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-[10px]">
              You (Off)
            </div>
          )}
          <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white">
            You
          </span>
        </div>

      </div>

    </div>
  );
};
