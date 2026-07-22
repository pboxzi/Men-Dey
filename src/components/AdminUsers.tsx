import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { createNotification } from '../utils/notifications';
import {
  Users, Search, Loader2, Crown, Shield, Mail, MapPin, Calendar,
  ChevronRight, X, Award, Star, MessageCircle, TrendingUp, Ban, CheckCircle, Trash2
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  country: string;
  avatar_text: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  membership: string;
  experiences: number;
  events: number;
  badges: number;
  points: number;
  journeyLogs: number;
}

export default function AdminUsers({ showToast }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  // Initial load + polling every 10s for new users
  useEffect(() => {
    const init = async () => {
      await fetchUsers();
      setLoading(false);
    };
    init();

    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const [
        { data: membership },
        { count: expCount },
        { count: eventCount },
        { count: badgeCount },
        { data: pointsData },
        { count: journeyCount },
      ] = await Promise.all([
        supabase.from('membership_applications').select('status, tier').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('experience_requests').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('loyalty_points').select('total').eq('user_id', userId).maybeSingle(),
        supabase.from('journey_log').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setUserStats({
        membership: membership?.status || 'None',
        experiences: expCount ?? 0,
        events: eventCount ?? 0,
        badges: badgeCount ?? 0,
        points: pointsData?.total || 0,
        journeyLogs: journeyCount ?? 0,
      });
    } catch (e) {
      console.error('Failed to fetch user stats:', e);
    }
    setStatsLoading(false);
  };

  const handleSelectUser = async (user: Profile) => {
    setSelectedUser(user);
    await fetchUserStats(user.id);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      showToast('Failed to update role', 'error');
    } else {
      showToast(`Role changed to ${newRole}`, 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }

      // Notify the user
      createNotification({
        userId,
        type: 'system',
        title: 'Role Updated',
        message: `Your role has been updated to ${newRole}.`,
        sendEmail: false,
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .rpc('admin_delete_user', { target_user_id: userId });

    if (error) {
      // Fallback: try direct delete
      const { error: delError } = await supabase.from('profiles').delete().eq('id', userId);
      if (delError) {
        showToast('Failed to delete user', 'error');
        return;
      }
    }

    showToast('User deleted', 'success');
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedUser?.id === userId) setSelectedUser(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery === '' ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.country?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && u.role === 'admin') ||
      (roleFilter === 'user' && u.role !== 'admin');
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return { color: 'border-gold-500/30 bg-gold-500/10 text-gold-500', icon: Crown, label: 'Admin' };
    return { color: 'border-neutral-700 bg-neutral-900 text-neutral-400', icon: Shield, label: 'User' };
  };

  const getInitials = (name: string) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-gold-400 tracking-widest uppercase mb-1">
          <Users className="h-3 w-3" />
          User Management
        </div>
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Community Members</h2>
        <p className="text-xs text-neutral-500 font-mono">View and manage all registered platform users.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, icon: Users },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Crown },
          { label: 'Users', value: users.filter(u => u.role !== 'admin').length, icon: Shield },
          { label: 'This Month', value: users.filter(u => {
            const d = new Date(u.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, icon: Calendar },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-neutral-900 bg-neutral-950 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className="h-3 w-3 text-gold-500" />
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white font-mono">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'admin', 'user'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                roleFilter === role
                  ? 'bg-gold-500 text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {role === 'user' ? 'Users' : role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Users List */}
        <div className={`lg:col-span-2 rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden ${selectedUser ? 'hidden lg:block' : ''}`}>
          <div className="p-3 border-b border-neutral-900">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              Users ({filteredUsers.length})
            </p>
          </div>
          <div className="divide-y divide-neutral-900/50 max-h-[600px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
                <p className="text-xs text-neutral-500">No users found</p>
              </div>
            ) : (
              filteredUsers.map(user => {
                const roleBadge = getRoleBadge(user.role);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-neutral-900/50 transition-all ${
                      selectedUser?.id === user.id ? 'bg-neutral-900/80 border-l-2 border-l-gold-500' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono font-bold text-gold-500">{getInitials(user.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{user.name || 'Unnamed'}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono uppercase ${roleBadge.color}`}>
                          <roleBadge.icon className="h-2.5 w-2.5" />
                          {roleBadge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-600 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* User Detail Panel */}
        <div className={`lg:col-span-1 rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden ${!selectedUser ? 'hidden lg:block' : ''}`}>
          {!selectedUser ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-3">
                <Users className="h-10 w-10 text-neutral-700 mx-auto" />
                <p className="text-xs text-neutral-500">Select a user to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* Close button (mobile) */}
              <div className="flex justify-between items-start lg:hidden">
                <div />
                <button onClick={() => setSelectedUser(null)} className="text-neutral-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Header */}
              <div className="text-center space-y-3 pb-4 border-b border-neutral-900">
                <div className="h-16 w-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                  <span className="text-lg font-mono font-bold text-gold-500">{getInitials(selectedUser.name)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedUser.name || 'Unnamed'}</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">{selectedUser.email}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-mono uppercase ${getRoleBadge(selectedUser.role).color}`}>
                    {getRoleBadge(selectedUser.role).label}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-400">{selectedUser.country || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-400">Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-neutral-400 font-mono text-[10px]">{selectedUser.id.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 pb-4 border-b border-neutral-900">
                <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Activity</h4>
                {statsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 text-gold-500 animate-spin" />
                  </div>
                ) : userStats ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Membership', value: userStats.membership, icon: Award },
                      { label: 'Experiences', value: userStats.experiences, icon: Star },
                      { label: 'Events', value: userStats.events, icon: Calendar },
                      { label: 'Badges', value: userStats.badges, icon: Award },
                      { label: 'Points', value: userStats.points, icon: TrendingUp },
                      { label: 'Journey Logs', value: userStats.journeyLogs, icon: MessageCircle },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-lg bg-neutral-900/50 p-2 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <stat.icon className="h-2.5 w-2.5 text-gold-500" />
                          <span className="text-[8px] font-mono text-neutral-500 uppercase">{stat.label}</span>
                        </div>
                        <p className="text-sm font-bold text-white font-mono">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Actions</h4>
                <button
                  onClick={() => handleToggleRole(selectedUser.id, selectedUser.role)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all ${
                    selectedUser.role === 'admin'
                      ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                      : 'border-gold-500/30 text-gold-500 hover:bg-gold-500/10'
                  }`}
                >
                  {selectedUser.role === 'admin' ? (
                    <><Ban className="h-3.5 w-3.5" /> Revoke Admin</>
                  ) : (
                    <><Crown className="h-3.5 w-3.5" /> Promote to Admin</>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-widest transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete User
                </button>
                <div className="rounded-lg bg-neutral-900/30 border border-neutral-900 p-3">
                  <p className="text-[9px] text-neutral-500 leading-relaxed">
                    {selectedUser.role === 'admin'
                      ? 'This user has full administrative access to all portal features, content management, and user oversight.'
                      : 'This user has standard member access. They can browse content, request experiences, and earn rewards.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
