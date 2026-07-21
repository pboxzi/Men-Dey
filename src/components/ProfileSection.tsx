import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Upload, Camera, Mail, Phone, MapPin, Globe, Film, BookOpen, Save, Loader2, Crown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';

interface Props {
  authName: string;
  authEmail: string;
  authCountry: string;
  onAuthNameChange: (v: string) => void;
  onAuthCountryChange: (v: string) => void;
  rank: { name: string; icon: string; badgeColor: string; min: number; max: number; next: string };
  progressPercent: number;
  loyaltyPoints: number;
  membership: any;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain', 'Japan', 'Brazil', 'India', 'Global', 'Other'];

export default function ProfileSection({ authName, authEmail, authCountry, onAuthNameChange, onAuthCountryChange, rank, progressPercent, loyaltyPoints, membership, showToast }: Props) {
  const { profile, user, updateProfile } = useAuth();

  const [bio, setBio] = useState(profile?.bio || '');
  const [favoriteMovie, setFavoriteMovie] = useState(profile?.favorite_movie || '');
  const [contact, setContact] = useState(profile?.contact || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || profile?.avatar_text || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anon'}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) {
        showToast(uploadError.message || 'Upload failed', 'error');
        setUploadingAvatar(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl }).eq('id', user?.id);
      if (updateError) {
        showToast(updateError.message || 'Upload failed', 'error');
      } else {
        setAvatarUrl(publicUrl);
        showToast('Avatar uploaded successfully', 'success');
      }
      setUploadingAvatar(false);
    } catch {
      showToast('Upload failed', 'error');
      setUploadingAvatar(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: any = { name: authName };
    if (authCountry) updates.country = authCountry;
    updates.bio = bio;
    updates.favorite_movie = favoriteMovie;
    updates.contact = contact;

    const { error } = await updateProfile(updates);
    if (error) {
      showToast(error || 'Failed to save profile', 'error');
    } else {
      showToast('Profile details updated successfully!', 'success');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1 border-b border-neutral-900 pb-4">
        <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
          Your Official Profile
        </h2>
        <p className="text-xs text-neutral-500 font-mono">
          Maintain your active sanctuary biography, memberships, and achievements.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Avatar + Rank Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-900 pb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full border-2 border-dashed border-neutral-800 hover:border-gold-500/50 transition-all cursor-pointer group flex items-center justify-center overflow-hidden shrink-0 bg-neutral-900"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-neutral-600" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-gold-500 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </div>

            <div className="leading-tight text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">{authName}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wider uppercase ${rank.badgeColor}`}>
                  <span>{rank.icon}</span>
                  <span>{rank.name}</span>
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono mt-1">COUNTRY: {authCountry}</p>
            </div>
          </div>

          {/* Loyalty Progress */}
          <div className="w-full md:w-64 space-y-2 bg-neutral-900/30 border border-neutral-900/50 p-3 rounded-xl text-left">
            <div className="flex justify-between items-center text-[9px] font-mono">
              <span className="text-neutral-500 uppercase tracking-widest font-semibold">CO-OP LOYALTY RANK</span>
              <span className="text-gold-500 font-bold">{loyaltyPoints.toLocaleString()} PTS</span>
            </div>
            <div className="relative w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden border border-neutral-800/40">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 via-yellow-500 to-gold-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500 leading-tight">
              <span>{rank.min} PTS</span>
              <span className="text-neutral-400 font-medium truncate max-w-[150px]">Next: {rank.next} ({rank.max} PTS)</span>
            </div>
          </div>
        </div>

        {/* Membership Card (if active) */}
        {membership?.status === 'active' && (
          <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/[0.03] via-neutral-950 to-neutral-950 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold-500" />
                <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest font-bold">Official Membership</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-500 text-[8px] font-mono font-bold uppercase">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div><span className="text-neutral-500 block text-[9px]">Tier</span><span className="text-white font-bold">{membership.tier_name}</span></div>
              <div><span className="text-neutral-500 block text-[9px]">Member #</span><span className="text-white font-mono">{membership.membership_number || 'N/A'}</span></div>
              <div><span className="text-neutral-500 block text-[9px]">Activated</span><span className="text-white">{membership.activation_date ? new Date(membership.activation_date).toLocaleDateString() : 'N/A'}</span></div>
              <div><span className="text-neutral-500 block text-[9px]">Expires</span><span className="text-white">{membership.expiration_date ? new Date(membership.expiration_date).toLocaleDateString() : 'Never'}</span></div>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3 text-gold-500" /> FULL NAME
              </label>
              <input type="text" value={authName} onChange={(e) => onAuthNameChange(e.target.value)}
                className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-white outline-none focus:border-gold-500/50 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-gold-500" /> EMAIL ADDRESS
              </label>
              <input type="email" value={authEmail} disabled
                className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-neutral-500 outline-none cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-gold-500" /> PRIMARY CONTACT
              </label>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or messaging handle"
                className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-white outline-none focus:border-gold-500/50 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gold-500" /> COUNTRY
              </label>
              <select value={authCountry} onChange={(e) => onAuthCountryChange(e.target.value)}
                className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-white outline-none focus:border-gold-500/50 transition-colors appearance-none cursor-pointer">
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="h-3 w-3 text-gold-500" /> FAVORITE GILLIAN MOVIE / PROJECT
            </label>
            <input type="text" value={favoriteMovie} onChange={(e) => setFavoriteMovie(e.target.value)} placeholder="e.g. The X-Files, The Crown, Sex Education, etc."
              className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-white outline-none focus:border-gold-500/50 transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-gold-500" /> BIOGRAPHY / STORY
            </label>
            <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the Sanctuary community about yourself..."
              className="w-full rounded border border-neutral-900 bg-neutral-900/40 px-3 py-2.5 text-white outline-none focus:border-gold-500/50 transition-colors resize-none leading-relaxed" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Save className="h-3.5 w-3.5" /> Save Profile Credentials</>}
          </button>
        </div>
      </div>
    </div>
  );
}
