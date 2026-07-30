import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, PublicProfile, MatchFilters, ChatMessage, RoomInfo } from '../types';

import { socketService } from '../services/socket';
import { getStoredProfile, saveStoredProfile, DEFAULT_PROFILE } from '../services/storage';
import { webrtcManager } from '../services/webrtc';

export type ChatStatus = 'idle' | 'searching' | 'connected';

export function useChat() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    return getStoredProfile() || DEFAULT_PROFILE;
  });

  const [status, setStatus] = useState<ChatStatus>('idle');
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Media controls
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iceRestartAttemptedRef = useRef<boolean>(false);
  const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync profile edits to local storage
  const updateProfile = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile);
  }, []);

  const skipStrangerRef = useRef<() => void>(() => {});

  // Connect socket on mount
  useEffect(() => {
    socketService.connect();

    const unsubOnline = socketService.subscribe('online_count', (count: number) => {
      setOnlineCount(count);
    });

    const unsubMatch = socketService.subscribe('match_found', async (data: RoomInfo) => {
      console.log('Match found!', data);
      setRoomInfo(data);
      setStatus('connected');
      setVideoFailed(false);
      iceRestartAttemptedRef.current = false;
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      setMessages([
        {
          id: 'sys_' + Date.now(),
          sender: 'system',
          text: `You are now connected with a Stranger from ${data.partnerProfile.country}! Say hello! 👋`,
          timestamp: Date.now(),
        },
      ]);
      setElapsedSeconds(0);

      // Start WebRTC peer connection if mode is video
      if (data.mode === 'video') {
        const stream = await webrtcManager.getLocalMedia(true, true);
        if (stream) {
          setLocalStream(stream);
        }
        webrtcManager.onRemoteStreamCallback = (rStream) => {
          setRemoteStream(rStream);
          setVideoFailed(false);
        };

        webrtcManager.onConnectionStateCallback = (connectionState) => {
          console.log('[WebRTC Connection State]', connectionState);
          if (connectionState === 'connected') {
            setVideoFailed(false);
            if (recoveryTimerRef.current) {
              clearTimeout(recoveryTimerRef.current);
              recoveryTimerRef.current = null;
            }
          } else if (connectionState === 'failed' || connectionState === 'disconnected') {
            if (!iceRestartAttemptedRef.current) {
              iceRestartAttemptedRef.current = true;
              console.log('WebRTC connection interrupted. Attempting ICE restart...');
              webrtcManager.restartIce();
            }

            if (!recoveryTimerRef.current) {
              recoveryTimerRef.current = setTimeout(() => {
                const pc = webrtcManager.getPeerConnection();
                if (!pc || pc.connectionState !== 'connected') {
                  console.warn('WebRTC video connection failed after retry.');
                  setVideoFailed(true);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: 'sys_' + Date.now(),
                      sender: 'system',
                      text: 'Video connection failed — you can keep chatting by text or skip to the next stranger.',
                      timestamp: Date.now(),
                    },
                  ]);
                }
              }, 5000);
            }
          }
        };

        webrtcManager.onConnectionTimeoutCallback = () => {
          console.warn('WebRTC connection timed out (12s without stream). Marking video failed...');
          setVideoFailed(true);
          setMessages((prev) => [
            ...prev,
            {
              id: 'sys_' + Date.now(),
              sender: 'system',
              text: 'Video connection failed — you can keep chatting by text or skip to the next stranger.',
              timestamp: Date.now(),
            },
          ]);
        };

        await webrtcManager.initPeerConnection(data.roomId, data.isInitiator);
      }
    });

    const unsubMsg = socketService.subscribe('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    const unsubTyping = socketService.subscribe('partner_typing', (isTyping: boolean) => {
      setIsPartnerTyping(isTyping);
    });

    const unsubDisconnected = socketService.subscribe('stranger_disconnected', () => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          sender: 'system',
          text: 'Stranger has disconnected.',
          timestamp: Date.now(),
        },
      ]);
      webrtcManager.cleanupPeerConnection();
      setRemoteStream(null);
      setRoomInfo(null);
      setVideoFailed(false);
      setStatus('idle');
    });

    return () => {
      unsubOnline();
      unsubMatch();
      unsubMsg();
      unsubTyping();
      unsubDisconnected();
    };
  }, []);

  // Timer for active connection
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Start searching for a stranger
  const startMatchmaking = useCallback(
    async (modeOverride?: 'text' | 'video') => {
      if (!profile.ageVerified) {
        return false;
      }

      const activeMode = modeOverride || profile.preferredFilters.mode || 'text';
      const updatedFilters: MatchFilters = {
        ...profile.preferredFilters,
        mode: activeMode,
      };

      // Prepare public profile (only send safe public attributes)
      const publicProfile: PublicProfile = {
        nickname: profile.displayName || 'Friendly Stranger',
        gender: profile.gender,
        country: profile.country,
        languages: profile.languages,
        interests: profile.interests,
      };

      // Cleanup prior room & streams if any
      webrtcManager.cleanupPeerConnection();
      setRemoteStream(null);
      setRoomInfo(null);
      setVideoFailed(false);
      setMessages([]);
      setStatus('searching');

      // Request media if video mode
      if (activeMode === 'video') {
        const stream = await webrtcManager.getLocalMedia(true, true);
        if (stream) setLocalStream(stream);
      }

      socketService.joinQueue(publicProfile, updatedFilters);
      return true;
    },
    [profile]
  );

  // Cancel queue / search
  const cancelMatchmaking = useCallback(() => {
    socketService.leaveQueue();
    webrtcManager.closeAll();
    setLocalStream(null);
    setRemoteStream(null);
    setVideoFailed(false);
    setStatus('idle');
  }, []);

  // Send text message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !roomInfo) return;

      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'self',
        text: text.trim(),
        timestamp: Date.now(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, newMsg]);
      socketService.sendMessage(roomInfo.roomId, text.trim());
      socketService.sendTyping(roomInfo.roomId, false);
    },
    [roomInfo]
  );

  // Handle typing indicator
  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomInfo) return;
      socketService.sendTyping(roomInfo.roomId, isTyping);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.sendTyping(roomInfo.roomId, false);
        }, 3000);
      }
    },
    [roomInfo]
  );

  // Skip current stranger & immediately search next
  const skipStranger = useCallback(() => {
    if (roomInfo) {
      socketService.skipStranger(roomInfo.roomId);
    }
    webrtcManager.cleanupPeerConnection();
    setRemoteStream(null);
    setVideoFailed(false);
    startMatchmaking();
  }, [roomInfo, startMatchmaking]);

  useEffect(() => {
    skipStrangerRef.current = skipStranger;
  }, [skipStranger]);

  // End chat and stay idle
  const endChat = useCallback(() => {
    if (roomInfo) {
      socketService.skipStranger(roomInfo.roomId);
    }
    webrtcManager.closeAll();
    setLocalStream(null);
    setRemoteStream(null);
    setRoomInfo(null);
    setVideoFailed(false);
    setMessages([]);
    setStatus('idle');
  }, [roomInfo]);

  // Toggle Video
  const toggleCamera = useCallback(() => {
    const nextState = webrtcManager.toggleVideo();
    setIsVideoEnabled(nextState);
  }, []);

  // Toggle Audio
  const toggleMic = useCallback(() => {
    const nextState = webrtcManager.toggleAudio();
    setIsAudioEnabled(nextState);
  }, []);

  // Report User
  const reportStranger = useCallback(
    (reason: string, details?: string) => {
      if (roomInfo) {
        socketService.reportUser(roomInfo.roomId, reason, details);
        endChat();
      }
    },
    [roomInfo, endChat]
  );

  // Block User
  const blockStranger = useCallback(() => {
    if (roomInfo) {
      socketService.blockUser(roomInfo.roomId);
      endChat();
    }
  }, [roomInfo, endChat]);

  return {
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
  };
}
