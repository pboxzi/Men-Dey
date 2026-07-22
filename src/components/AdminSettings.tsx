import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
  Settings, Save, Loader2, Globe, Share2, Mail, Phone,
  ToggleLeft, ToggleRight, AlertTriangle, Database,
  RefreshCw, Trash2, Eye, EyeOff, Users, MessageCircle,
  Newspaper, Calendar, Star, Shield, Wifi, WifiOff
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string;
  is_public: boolean;
  updated_at: string;
}

export default function AdminSettings({ showToast }: Props) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').order('group');
    if (data) {
      setSettings(data);
      setHasChanges(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSettings();
      setLoading(false);
    };
    init();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        await supabase
          .from('site_settings')
          .update({ value: setting.value, updated_at: new Date().toISOString() })
          .eq('id', setting.id);
      }
      showToast('Settings saved successfully', 'success');
      setHasChanges(false);
    } catch (e) {
      showToast('Failed to save settings', 'error');
    }
    setSaving(false);
  };

  const getSetting = (key: string) => settings.find(s => s.key === key);

  const groups = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'features', label: 'Features', icon: ToggleRight },
    { id: 'system', label: 'System', icon: Shield },
  ];

  const groupSettings = settings.filter(s => s.group === activeGroup);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gold-400 tracking-widest uppercase mb-1">
            <Settings className="h-3 w-3" />
            Platform Settings
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wider text-white uppercase">Configuration</h2>
          <p className="text-xs text-neutral-500 font-mono">Manage platform-wide settings and feature toggles.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold-500 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-gold-400 disabled:opacity-40 transition-all"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-400 text-[10px] font-mono">
          <AlertTriangle className="h-3.5 w-3.5" />
          You have unsaved changes
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-1">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[11px] font-medium transition-all ${
                activeGroup === group.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
              }`}
            >
              <group.icon className={`h-4 w-4 ${activeGroup === group.id ? 'text-gold-500' : 'text-neutral-500'}`} />
              {group.label}
              <span className="ml-auto text-[9px] font-mono text-neutral-600">
                {settings.filter(s => s.group === group.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 rounded-xl border border-neutral-900 bg-neutral-950 p-6 space-y-6">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest pb-3 border-b border-neutral-900">
            {groups.find(g => g.id === activeGroup)?.label} Settings
          </h3>

          {activeGroup === 'general' && (
            <div className="space-y-5">
              <SettingInput
                label="Platform Name"
                description="The public name of your platform"
                value={getSetting('site_name')?.value || ''}
                onChange={(v) => updateSetting('site_name', v)}
              />
              <SettingInput
                label="Tagline"
                description="Short tagline displayed on the homepage"
                value={getSetting('site_tagline')?.value || ''}
                onChange={(v) => updateSetting('site_tagline', v)}
              />
              <SettingInput
                label="Meta Description"
                description="SEO description for search engines"
                value={getSetting('site_description')?.value || ''}
                onChange={(v) => updateSetting('site_description', v)}
                textarea
              />
            </div>
          )}

          {activeGroup === 'social' && (
            <div className="space-y-5">
              <SettingInput
                label="Instagram URL"
                description="Link to your Instagram profile"
                value={getSetting('social_instagram')?.value || ''}
                onChange={(v) => updateSetting('social_instagram', v)}
                icon={<Share2 className="h-3.5 w-3.5 text-pink-400" />}
              />
              <SettingInput
                label="Twitter / X URL"
                description="Link to your Twitter/X profile"
                value={getSetting('social_twitter')?.value || ''}
                onChange={(v) => updateSetting('social_twitter', v)}
                icon={<Share2 className="h-3.5 w-3.5 text-blue-400" />}
              />
              <SettingInput
                label="YouTube URL"
                description="Link to your YouTube channel"
                value={getSetting('social_youtube')?.value || ''}
                onChange={(v) => updateSetting('social_youtube', v)}
                icon={<Share2 className="h-3.5 w-3.5 text-red-400" />}
              />
            </div>
          )}

          {activeGroup === 'contact' && (
            <div className="space-y-5">
              <SettingInput
                label="Contact Email"
                description="Public contact email address"
                value={getSetting('contact_email')?.value || ''}
                onChange={(v) => updateSetting('contact_email', v)}
                icon={<Mail className="h-3.5 w-3.5 text-gold-500" />}
              />
              <SettingInput
                label="WhatsApp Number"
                description="WhatsApp number for fan contact (include country code, e.g. +447700900000)"
                value={getSetting('contact_whatsapp')?.value || ''}
                onChange={(v) => updateSetting('contact_whatsapp', v)}
                icon={<MessageCircle className="h-3.5 w-3.5 text-emerald-500" />}
              />
              <SettingInput
                label="Contact Phone"
                description="Phone number (optional)"
                value={getSetting('contact_phone')?.value || ''}
                onChange={(v) => updateSetting('contact_phone', v)}
                icon={<Phone className="h-3.5 w-3.5 text-gold-500" />}
              />
            </div>
          )}

          {activeGroup === 'features' && (
            <div className="space-y-4">
              <SettingToggle
                label="Membership System"
                description="Allow fans to apply for membership tiers and cards"
                value={getSetting('membership_enabled')?.value === 'true'}
                onChange={(v) => updateSetting('membership_enabled', String(v))}
                icon={<Users className="h-4 w-4" />}
              />
              <SettingToggle
                label="Fan Requests"
                description="Allow fans to submit experience and event requests"
                value={getSetting('requests_enabled')?.value === 'true'}
                onChange={(v) => updateSetting('requests_enabled', String(v))}
                icon={<Star className="h-4 w-4" />}
              />
              <SettingToggle
                label="Newsletter"
                description="Allow fans to subscribe to the newsletter"
                value={getSetting('newsletter_enabled')?.value === 'true'}
                onChange={(v) => updateSetting('newsletter_enabled', String(v))}
                icon={<Newspaper className="h-4 w-4" />}
              />
              <SettingToggle
                label="Ask Gillian"
                description="Allow fans to chat with Gillian directly"
                value={getSetting('ask_gillian_enabled')?.value === 'true'}
                onChange={(v) => updateSetting('ask_gillian_enabled', String(v))}
                icon={<MessageCircle className="h-4 w-4" />}
              />
              <SettingToggle
                label="Events"
                description="Allow fans to browse and register for events"
                value={getSetting('events_enabled')?.value === 'true'}
                onChange={(v) => updateSetting('events_enabled', String(v))}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
          )}

          {activeGroup === 'system' && (
            <div className="space-y-5">
              <SettingToggle
                label="Maintenance Mode"
                description="Temporarily block all public access to the platform"
                value={getSetting('maintenance_mode')?.value === 'true'}
                onChange={(v) => updateSetting('maintenance_mode', String(v))}
                icon={<AlertTriangle className="h-4 w-4" />}
                danger
              />

              <div className="pt-4 border-t border-neutral-900">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-4">System Utilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg border border-neutral-900 bg-neutral-900/30 flex items-center gap-3">
                    <Database className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-[10px] font-mono font-bold text-white">Supabase DB</p>
                      <p className="text-[9px] text-neutral-500">Automatic backups managed</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await fetchSettings();
                      showToast('Settings refreshed from database', 'success');
                    }}
                    className="p-4 rounded-lg border border-neutral-900 hover:border-neutral-800 bg-neutral-900/30 flex items-center gap-3 group transition-all"
                  >
                    <RefreshCw className="h-5 w-5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                    <div className="text-left">
                      <p className="text-[10px] font-mono font-bold text-white">Refresh Settings</p>
                      <p className="text-[9px] text-neutral-500">Re-fetch from database</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable input component
function SettingInput({
  label, description, value, onChange, textarea, icon
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-neutral-500">{icon}</span>}
        <label className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{label}</label>
      </div>
      <p className="text-[9px] text-neutral-500">{description}</p>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 resize-none transition-colors"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-gold-500/40 transition-colors"
        />
      )}
    </div>
  );
}

// Reusable toggle component
function SettingToggle({
  label, description, value, onChange, icon, danger
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
      danger && value ? 'border-red-500/30 bg-red-500/5' : 'border-neutral-900 bg-neutral-900/30'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`${danger && value ? 'text-red-400' : 'text-gold-500'}`}>{icon}</span>
        <div>
          <span className="text-xs font-bold text-white">{label}</span>
          <p className="text-[10px] text-neutral-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="shrink-0"
      >
        {value ? (
          <Wifi className={`h-6 w-6 ${danger ? 'text-red-400' : 'text-emerald-400'}`} />
        ) : (
          <WifiOff className="h-6 w-6 text-neutral-600" />
        )}
      </button>
    </div>
  );
}
