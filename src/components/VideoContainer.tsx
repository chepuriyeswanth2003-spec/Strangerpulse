import React, { useRef, useEffect, useState } from 'react';
import { PublicProfile } from '../types';
import { Camera, CameraOff, Mic, MicOff, Maximize, Globe, User, AlertTriangle, VideoOff } from 'lucide-react';
import { webrtcManager } from '../services/webrtc';

interface VideoContainerProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  partnerProfile: PublicProfile;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  videoFailed?: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({
  localStream,
  remoteStream,
  partnerProfile,
  isVideoEnabled,
  isAudioEnabled,
  videoFailed = false,
  onToggleCamera,
  onToggleMic,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWeakConnection, setIsWeakConnection] = useState(false);

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

  // Poll RTCPeerConnection stats every 2 seconds
  useEffect(() => {
    let lastPacketsLost = 0;
    const interval = setInterval(async () => {
      const pc = webrtcManager.getPeerConnection();
      if (!pc || pc.connectionState !== 'connected') {
        setIsWeakConnection(false);
        return;
      }

      try {
        const stats = await pc.getStats();
        let currentPacketsLost = 0;
        let highJitter = false;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            if (report.packetsLost !== undefined) {
              currentPacketsLost = report.packetsLost;
            }
            if (report.jitter !== undefined && report.jitter > 0.08) {
              highJitter = true;
            }
          }
        });

        const lostDelta = currentPacketsLost - lastPacketsLost;
        lastPacketsLost = currentPacketsLost;

        if (lostDelta > 5 || highJitter) {
          setIsWeakConnection(true);
        } else {
          setIsWeakConnection(false);
        }
      } catch (err) {
        // Ignore stats polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
      className="relative w-full h-full min-h-[320px] bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col justify-between group"
    >
      
      {/* Remote Video (Stranger) */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        {videoFailed ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-zinc-950 max-w-sm rounded-3xl border border-zinc-800 shadow-2xl mx-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-300 flex items-center justify-center border border-zinc-800">
              <VideoOff className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold text-base">Video Feed Unavailable</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Peer's camera didn't connect, but <strong className="text-white">Text Chat is active below!</strong> Say hello to {partnerProfile.nickname} or click Next Stranger.
              </p>
            </div>
          </div>
        ) : remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-zinc-900 text-zinc-300 flex items-center justify-center border border-zinc-800">
              <User className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-bold text-base">{partnerProfile.nickname}</p>
              <p className="text-xs text-zinc-500">Connecting video feed...</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Overlay: Stranger Profile Info & Connection Quality Badge */}
      <div className="relative z-10 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-start justify-between">
        <div className="flex flex-col gap-1.5 max-w-[70%]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              {partnerProfile.nickname}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 text-zinc-300 text-xs font-semibold flex items-center gap-1 border border-zinc-800">
              <Globe className="w-3 h-3 text-zinc-400" />
              {partnerProfile.country}
            </span>
            {isWeakConnection && (
              <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
                Weak Connection
              </span>
            )}
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          id="fullscreen-video-btn"
          className="p-2 rounded-xl bg-black/60 hover:bg-zinc-900 text-white backdrop-blur-md border border-zinc-800 transition-all"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Controls & PIP Local Self-Video */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end justify-between">
        
        {/* Media Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCamera}
            id="toggle-camera-btn"
            className={`p-3 rounded-2xl backdrop-blur-md border font-semibold text-xs transition-all flex items-center gap-2 ${
              isVideoEnabled
                ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                : 'bg-white border-white text-black hover:bg-zinc-200'
            }`}
          >
            {isVideoEnabled ? <Camera className="w-4 h-4 text-zinc-300" /> : <CameraOff className="w-4 h-4 text-black" />}
          </button>

          <button
            onClick={onToggleMic}
            id="toggle-mic-btn"
            className={`p-3 rounded-2xl backdrop-blur-md border font-semibold text-xs transition-all flex items-center gap-2 ${
              isAudioEnabled
                ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                : 'bg-white border-white text-black hover:bg-zinc-200'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-4 h-4 text-zinc-300" /> : <MicOff className="w-4 h-4 text-black" />}
          </button>
        </div>

        {/* Local PIP Video */}
        <div className="w-28 sm:w-36 aspect-video bg-zinc-950 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl relative group-hover:scale-105 transition-transform">
          {localStream && localStream.getVideoTracks().length > 0 ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-[10px]">
              You (Off)
            </div>
          )}
          <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white border border-zinc-800">
            You
          </span>
        </div>

      </div>

    </div>
  );
};
