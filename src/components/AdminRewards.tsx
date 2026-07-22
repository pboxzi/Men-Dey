import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Gift, Award, TrendingUp, Plus, Trash2, Edit3, Save, X,
  Loader2, Star, Users, Search, Crown
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  cost: number;
  active: boolean;
  created_at: string;
}

interface UserBadge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  created_at: string;
  profiles?: { name: string; email: string };
}

interface UserPoints {
  id: string;
  user_id: string;
  total: number;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; email: string };
}

export default function AdminRewards({ showToast }: Props) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'rewards' | 'badges' | 'points'>('rewards');
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [showAddReward, setShowAddReward] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('🎁');
  const [formCost, setFormCost] = useState(100);

  // Points adjustment
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchRewards = async () => {
    const { data } = await supabase.from('portal_rewards').select('*').order('cost');
    if (data) setRewards(data);
  };

  const fetchBadges = async () => {
    const { data } = await supabase.from('user_badges').select('*').order('created_at', { ascending: false });
    if (data) {
      const withProfiles = await Promise.all(
        data.map(async (b: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', b.user_id)
            .maybeSingle();
          return { ...b, profiles: profile || { name: 'Unknown', email: '' } };
        })
      );
      setUserBadges(withProfiles);
    }
  };

  const fetchPoints = async () => {
    const { data } = await supabase.from('loyalty_points').select('*').order('total', { ascending: false });
    if (data) {
      const withProfiles = await Promise.all(
        data.map(async (p: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', p.user_id)
            .maybeSingle();
          return { ...p, profiles: profile || { name: 'Unknown', email: '' } };
        })
      );
      setUserPoints(withProfiles);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchRewards(), fetchBadges(), fetchPoints()]);
      setLoading(false);
    };
    init();
  }, []);

  // CRUD: Add Reward
  const handleAddReward = async () => {
    if (!formTitle.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    const { error } = await supabase.from('portal_rewards').insert({
      title: formTitle.trim(),
      description: formDesc.trim(),
      icon: formIcon,
      cost: formCost,
    });
    if (error) {
      showToast('Failed to add reward', 'error');
    } else {
      showToast('Reward added', 'success');
      setShowAddReward(false);
      resetForm();
      await fetchRewards();
    }
  };

  // CRUD: Update Reward
  const handleUpdateReward = async (id: string) => {
    const { error } = await supabase
      .from('portal_rewards')
      .update({ title: formTitle.trim(), description: formDesc.trim(), icon: formIcon, cost: formCost, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      showToast('Failed to update reward', 'error');
    } else {
      showToast('Reward updated', 'success');
      setEditingReward(null);
      resetForm();
      await fetchRewards();
    }
  };

  // CRUD: Delete Reward
  const handleDeleteReward = async (id: string) => {
    const { error } = await supabase.from('portal_rewards').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete reward', 'error');
    } else {
      showToast('Reward deleted', 'success');
      await fetchRewards();
    }
  };

  // Toggle active
  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('portal_rewards').update({ active: !current, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchRewards();
  };

  // Delete badge
  const handleDeleteBadge = async (id: string) => {
    const { error } = await supabase.from('user_badges').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete badge', 'error');
    } else {
      showToast('Badge revoked', 'success');
      await fetchBadges();
    }
  };

  // Adjust points
  const handleAdjustPoints = async () => {
    if (!adjustUserId.trim() || adjustAmount === 0) {
      showToast('Enter user ID and amount', 'error');
      return;
    }

    const { data: existing } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', adjustUserId.trim())
      .maybeSingle();

    if (existing) {
      const newTotal = Math.max(0, existing.total + adjustAmount);
      await supabase
        .from('loyalty_points')
        .update({ total: newTotal, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('loyalty_points').insert({
        user_id: adjustUserId.trim(),
        total: Math.max(0, adjustAmount),
      });
    }

    showToast(`Points ${adjustAmount > 0 ? 'added' : 'deducted'} successfully`, 'success');
    setAdjustUserId('');
    setAdjustAmount(0);
    setAdjustReason('');
    await fetchPoints();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormIcon('🎁');
    setFormCost(100);
  };

  const startEdit = (reward: Reward) => {
    setEditingReward(reward.id);
    setFormTitle(reward.title);
    setFormDesc(reward.description);
    setFormIcon(reward.icon);
    setFormCost(reward.cost);
  };

  const filteredRewards = rewards.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBadges = userBadges.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPoints = userPoints.filter(p =>
    p.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Gift className="h-3 w-3" />
          Rewards & Badges
        </div>
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Loyalty Management</h2>
        <p className="text-xs text-neutral-500 font-mono">Manage rewards, badges, and loyalty points for your community.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-neutral-900 pb-1">
        {[
          { id: 'rewards' as const, label: 'Rewards Store', icon: Gift, count: rewards.length },
          { id: 'badges' as const, label: 'User Badges', icon: Award, count: userBadges.length },
          { id: 'points' as const, label: 'Points Ledger', icon: TrendingUp, count: userPoints.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
              activeSubTab === tab.id
                ? 'bg-gold-500 text-neutral-950 font-bold'
                : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
              activeSubTab === tab.id ? 'bg-neutral-950/30 text-neutral-950' : 'bg-neutral-900 text-neutral-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-gold-500/40"
        />
      </div>

      {/* REWARDS STORE TAB */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-4">
          {/* Add Button */}
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Store Items ({filteredRewards.length})</p>
            <button
              onClick={() => { setShowAddReward(true); setEditingReward(null); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gold-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Add Reward
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddReward || editingReward) && (
            <div className="rounded-xl border border-gold-500/30 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{editingReward ? 'Edit Reward' : 'New Reward'}</h4>
                <button onClick={() => { setShowAddReward(false); setEditingReward(null); resetForm(); }}
                  className="text-neutral-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input type="text" placeholder="Icon (emoji)" value={formIcon} onChange={e => setFormIcon(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 text-center text-lg" />
                <input type="text" placeholder="Title" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
                <input type="number" placeholder="Cost (PTS)" value={formCost} onChange={e => setFormCost(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
              </div>
              <textarea placeholder="Description" value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddReward(false); setEditingReward(null); resetForm(); }}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 text-[10px] font-mono uppercase tracking-widest hover:text-white">Cancel</button>
                <button onClick={() => editingReward ? handleUpdateReward(editingReward) : handleAddReward()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gold-400">
                  <Save className="h-3 w-3" /> {editingReward ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Rewards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRewards.map(reward => (
              <div key={reward.id} className={`rounded-xl border bg-neutral-950 p-4 space-y-3 transition-all ${
                reward.active ? 'border-neutral-900' : 'border-neutral-900 opacity-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{reward.title}</h4>
                      <p className="text-gold-500 font-mono text-[10px] font-bold">{reward.cost} PTS</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleActive(reward.id, reward.active)}
                      className={`px-2 py-1 rounded text-[8px] font-mono uppercase ${
                        reward.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-900 text-neutral-600'
                      }`}>
                      {reward.active ? 'Live' : 'Off'}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">{reward.description}</p>
                <div className="flex gap-2 pt-1 border-t border-neutral-900">
                  <button onClick={() => startEdit(reward)}
                    className="flex items-center gap-1 text-[9px] text-neutral-500 hover:text-white font-mono uppercase">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => handleDeleteReward(reward.id)}
                    className="flex items-center gap-1 text-[9px] text-red-500/60 hover:text-red-400 font-mono uppercase">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BADGES TAB */}
      {activeSubTab === 'badges' && (
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Redeemed Badges ({filteredBadges.length})</p>

          {filteredBadges.length === 0 ? (
            <div className="rounded-xl border border-neutral-900 p-12 text-center">
              <Award className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-xs text-neutral-500">No badges redeemed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBadges.map(badge => (
                <div key={badge.id} className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{badge.title}</h4>
                        <p className="text-[9px] text-neutral-500">{badge.profiles?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBadge(badge.id)}
                      className="text-red-500/40 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed">{badge.description}</p>
                  <p className="text-[9px] text-gold-500 font-mono uppercase tracking-widest pt-1 border-t border-neutral-900">
                    Unlocked: {new Date(badge.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POINTS TAB */}
      {activeSubTab === 'points' && (
        <div className="space-y-4">
          {/* Adjust Points */}
          <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold-500" /> Adjust User Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input type="text" placeholder="User ID" value={adjustUserId} onChange={e => setAdjustUserId(e.target.value)}
                className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40 font-mono" />
              <input type="number" placeholder="+/- Amount" value={adjustAmount || ''} onChange={e => setAdjustAmount(Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500/40" />
              <button onClick={handleAdjustPoints}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gold-400">
                <Save className="h-3 w-3" /> Apply
              </button>
            </div>
          </div>

          {/* Points Leaderboard */}
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Points Ledger ({filteredPoints.length})</p>

          {filteredPoints.length === 0 ? (
            <div className="rounded-xl border border-neutral-900 p-12 text-center">
              <TrendingUp className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-xs text-neutral-500">No loyalty points recorded yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-900">
                    <th className="text-left px-4 py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">#</th>
                    <th className="text-left px-4 py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">User</th>
                    <th className="text-left px-4 py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Email</th>
                    <th className="text-right px-4 py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Points</th>
                    <th className="text-right px-4 py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPoints.map((p, i) => (
                    <tr key={p.id} className="border-b border-neutral-900/50 hover:bg-neutral-900/30">
                      <td className="px-4 py-3 text-neutral-500 font-mono">
                        {i === 0 && <Crown className="inline h-3 w-3 text-gold-500 mr-1" />}
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{p.profiles?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-neutral-500 font-mono text-[10px]">{p.profiles?.email || ''}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gold-500">{p.total.toLocaleString()} PTS</td>
                      <td className="px-4 py-3 text-right text-neutral-500 font-mono text-[10px]">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
