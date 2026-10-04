import {useCallback, useEffect, useState} from 'react';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {supabase} from '../../lib/supabase';

interface FormState {
  full_name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  date_of_birth: string;
  occupation: string;
  company: string;
  website: string;
  preferred_contact_method: string;
}

const EMPTY: FormState = {
  full_name: '',
  phone: '',
  country: '',
  city: '',
  address: '',
  date_of_birth: '',
  occupation: '',
  company: '',
  website: '',
  preferred_contact_method: 'email',
};

const CONTACT_OPTIONS = [
  {value: 'email', label: 'Email'},
  {value: 'phone', label: 'Phone'},
  {value: 'sms', label: 'SMS'},
  {value: 'none', label: 'No preference'},
];

export function ProfilePage() {
  const {profile, profileLoading, loading, refreshProfile} = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{tone: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
      date_of_birth: profile.date_of_birth ?? '',
      occupation: profile.occupation ?? '',
      company: profile.company ?? '',
      website: profile.website ?? '',
      preferred_contact_method: profile.preferred_contact_method ?? 'email',
    });
  }, [profile]);

  const set = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({...prev, [key]: value}));
    setMessage(null);
  };

  const save = useCallback(async () => {
    if (!profile) return;
    if (form.full_name.trim().length < 2) {
      setMessage({tone: 'error', text: 'Please enter your name.'});
      return;
    }
    if (form.website && !/^https?:\/\//i.test(form.website)) {
      setMessage({tone: 'error', text: 'Website must start with http:// or https://'});
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const {error: updateError} = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          date_of_birth: form.date_of_birth || null,
          occupation: form.occupation.trim() || null,
          company: form.company.trim() || null,
          website: form.website.trim() || null,
          preferred_contact_method: (form.preferred_contact_method || 'email') as
            | 'email'
            | 'phone'
            | 'sms'
            | 'none',
        })
        .eq('id', profile.id);
      if (updateError) throw new Error(updateError.message);
      await refreshProfile();
      setMessage({tone: 'success', text: 'Your profile has been saved.'});
    } catch (e) {
      setMessage({tone: 'error', text: e instanceof Error ? e.message : 'Could not save your profile.'});
    } finally {
      setSaving(false);
    }
  }, [form, profile, refreshProfile]);

  if (loading || profileLoading) return <FullPageLoader />;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-stone pb-6">
        <p className="eyebrow mb-2">Profile</p>
        <h1 className="text-3xl md:text-4xl">Your details</h1>
        <p className="mt-2 text-muted">
          Keep your details current so management can reach you properly. Role, membership and
          approval status are managed by management and cannot be edited here.
        </p>
      </div>

      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="surface space-y-5 p-6">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">Identity</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              {({id}) => (
                <input id={id} className="field-input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
              )}
            </Field>
            <Field label="Email" hint="Verified sign-in email — contact management to change it.">
              {({id}) => <input id={id} className="field-input" value={profile.email ?? ''} readOnly disabled />}
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone">
              {({id}) => (
                <input id={id} className="field-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              )}
            </Field>
            <Field label="Preferred contact method">
              {({id}) => (
                <select
                  id={id}
                  className="field-input"
                  value={form.preferred_contact_method}
                  onChange={(e) => set('preferred_contact_method', e.target.value)}
                >
                  {CONTACT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field label="Date of birth" hint="Used for age verification where an experience requires it.">
            {({id}) => (
              <input
                id={id}
                type="date"
                className="field-input"
                value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="surface space-y-5 p-6">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">Location</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Country">
              {({id}) => (
                <input id={id} className="field-input" value={form.country} onChange={(e) => set('country', e.target.value)} />
              )}
            </Field>
            <Field label="City">
              {({id}) => <input id={id} className="field-input" value={form.city} onChange={(e) => set('city', e.target.value)} />}
            </Field>
          </div>
          <Field label="Address">
            {({id}) => (
              <input id={id} className="field-input" value={form.address} onChange={(e) => set('address', e.target.value)} />
            )}
          </Field>
        </div>

        <div className="surface space-y-5 p-6">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">Professional</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Occupation">
              {({id}) => (
                <input id={id} className="field-input" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
              )}
            </Field>
            <Field label="Company">
              {({id}) => (
                <input id={id} className="field-input" value={form.company} onChange={(e) => set('company', e.target.value)} />
              )}
            </Field>
          </div>
          <Field label="Website">
            {({id}) => (
              <input
                id={id}
                className="field-input"
                placeholder="https://"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="surface border border-stone p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-charcoal">Managed by management</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Account</dt>
              <dd className="font-medium text-charcoal">{profile.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Email verified</dt>
              <dd className="font-medium text-charcoal">{profile.email_verified_at ? 'Yes' : 'Pending'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Membership</dt>
              <dd className="font-medium text-charcoal">Managed</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
