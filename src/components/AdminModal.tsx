import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Users, Video, Clock, Cpu, RefreshCw, CheckCircle2, AlertTriangle, Key, X, Server, Lock, KeyRound } from 'lucide-react';

interface AdminStats {
  status: string;
  uptime: number;
  onlineUsers: number;
  activeRooms: number;
  textRooms: number;
  videoRooms: number;
  queueSize: number;
  blockedPairsCount: number;
  rateLimitedSockets: number;
  recentReports: Array<{ id: string; roomId: string; reason: string; timestamp: number }>;
  environment: {
    nodeEnv: string;
    port: number;
    hasGoogleAuth: boolean;
    hasJwtSecret: boolean;
  };
  memory: {
    rssMb: string;
    heapUsedMb: string;
    heapTotalMb: string;
  };
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset Password State
  const [showResetForm, setShowResetForm] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setInputPassword('');
        fetchStats();
      } else {
        setAuthError(data.message || 'Incorrect admin password');
      }
    } catch {
      setAuthError('Connection failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetMessage({ type: 'success', text: 'Admin password updated successfully!' });
        setCurrentPass('');
        setNewPass('');
        setTimeout(() => setShowResetForm(false), 1500);
      } else {
        setResetMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch {
      setResetMessage({ type: 'error', text: 'Error connecting to server' });
    } finally {
      setIsResetting(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch system metrics');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Server unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    fetchStats();

    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, autoRefresh]);

  if (!isOpen) return null;

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Server Monitoring Dashboard
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SYSTEM STATUS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time active connection metrics and platform health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowResetForm(!showResetForm)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showResetForm ? 'Close Key Manager' : 'Reset Password'}</span>
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    autoRefresh
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto-Sync' : 'Paused'}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              id="close-admin-modal-btn"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          
          {/* PASSWORD GATE SCREEN */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Admin Panel Access</h3>
                <p className="text-xs text-slate-400">
                  Please enter the administrative password to view server monitoring metrics and active system stats.
                </p>
              </div>

              <form onSubmit={handleAuthenticate} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter password..."
                    id="admin-password-input"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-admin-pass-btn"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Unlock Admin Dashboard
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* PASSWORD RESET SUB-SECTION */}
              {showResetForm && (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-amber-500/30 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Admin Password</span>
                  </div>

                  <form onSubmit={handleResetPassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="Current password"
                        id="current-admin-pass"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="New password"
                        id="new-admin-pass"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between pt-2">
                      {resetMessage && (
                        <span className={`text-xs ${resetMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {resetMessage.text}
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isResetting}
                        id="save-new-admin-pass-btn"
                        className="ml-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {stats && (
                <>
                  {/* Top Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Active Connections</span>
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-2xl font-black text-white">{stats.onlineUsers}</div>
                      <span className="text-[10px] text-indigo-400 font-medium">Connected visitors</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Active Sessions</span>
                        <Video className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-black text-white">{stats.activeRooms}</div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {stats.videoRooms} video / {stats.textRooms} text
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Matchmaking Queue</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black text-white">{stats.queueSize}</div>
                      <span className="text-[10px] text-slate-400 font-medium">Waiting strangers</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Isolated Users</span>
                        <ShieldAlert className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-black text-white">{stats.blockedPairsCount}</div>
                      <span className="text-[10px] text-slate-400 font-medium">User block list</span>
                    </div>

                  </div>

                  {/* Server Performance & Environment Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Hardware & Memory Metrics */}
                    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        System Health Metrics
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Process Uptime</span>
                          <span className="font-mono text-white font-semibold">{formatUptime(stats.uptime)}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Memory Usage</span>
                          <span className="font-mono text-emerald-400 font-semibold">{stats.memory.heapUsedMb} MB / {stats.memory.heapTotalMb} MB</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Total System Allocation</span>
                          <span className="font-mono text-white font-semibold">{stats.memory.rssMb} MB</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Spam Protection Limits</span>
                          <span className="font-mono text-amber-400 font-semibold">{stats.rateLimitedSockets} active filters</span>
                        </div>
                      </div>
                    </div>

                    {/* Environment Setup Status */}
                    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Key className="w-4 h-4 text-purple-400" />
                        Services Configuration Status
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Google Account Integration</span>
                          {stats.environment.hasGoogleAuth ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Demo Mode
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Security Encryption Key</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400">Application Mode</span>
                          <span className="font-mono uppercase text-indigo-400 font-semibold">{stats.environment.nodeEnv}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Server Port</span>
                          <span className="font-mono text-white font-semibold">{stats.environment.port}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Reports Activity Log */}
                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        Moderation & User Reports
                      </span>
                      <span className="text-[10px] text-slate-500">Recent events</span>
                    </h3>

                    {stats.recentReports.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No user reports logged during this session.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
                        {stats.recentReports.map((rep) => (
                          <div key={rep.id} className="p-3 text-xs flex items-center justify-between bg-slate-900/40">
                            <div className="space-y-0.5">
                              <span className="font-mono text-indigo-400 text-[11px] font-bold block">{rep.roomId}</span>
                              <span className="text-slate-300 font-medium">Reason: {rep.reason}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(rep.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
