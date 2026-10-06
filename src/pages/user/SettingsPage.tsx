import {KeyRound, MailCheck, ShieldCheck, Trash2} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {Spinner} from '../../components/ui/Spinner';
import {reportError} from '../../lib/errors';
import {supabase} from '../../lib/supabase';
import type {ApplicantProfile, Request} from '../../types';
import {SectionCard} from './components/SectionCard';

interface EmailPrefs {
  notify_requests: boolean;
  notify_membership: boolean;
  notify_experiences: boolean;
  notify_messages: boolean;
}

interface CommPrefs {
  contact_email_ok: boolean;
  contact_phone_ok: boolean;
  contact_whatsapp_ok: boolean;
  whatsapp_number: string;
}

export function SettingsPage() {
  const {session, profile, profileLoading, loading, refreshProfile} = useAuth();

  const [applicant, setApplicant] = useState<ApplicantProfile | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<Request | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>({
    notify_requests: true,
    notify_membership: true,
    notify_experiences: true,
    notify_messages: true,
  });
  const [commPrefs, setCommPrefs] = useState<CommPrefs>({
    contact_email_ok: true,
    contact_phone_ok: false,
    contact_whatsapp_ok: false,
    whatsapp_number: '',
  });

  const [savingEmail, setSavingEmail] = useState(false);
  const [savingComm, setSavingComm] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{tone: 'success' | 'error'; text: string} | null>(null);
  const [commMessage, setCommMessage] = useState<{tone: 'success' | 'error'; text: string} | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{tone: 'success' | 'error'; text: string} | null>(null);

  const [deletionReason, setDeletionReason] = useState('');
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<{tone: 'success' | 'error'; text: string} | null>(null);

  const load = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [applicantRes, deletionRes] = await Promise.all([
        supabase.from('applicant_profiles').select('*').order('created_at', {ascending: false}).limit(1).maybeSingle(),
        supabase
          .from('requests')
          .select('*')
          .eq('title', 'Account deletion request')
          .in('status', ['submitted', 'in_review', 'information_requested', 'proposal', 'approved', 'scheduled'])
          .order('created_at', {ascending: false})
          .limit(1)
          .maybeSingle(),
      ]);
      if (applicantRes.error) throw new Error(applicantRes.error.message);
      if (deletionRes.error) throw new Error(deletionRes.error.message);

      const app = (applicantRes.data as ApplicantProfile | null) ?? null;
      setApplicant(app);
      if (app) {
        setCommPrefs({
          contact_email_ok: app.contact_email_ok,
          contact_phone_ok: app.contact_phone_ok,
          contact_whatsapp_ok: app.contact_whatsapp_ok,
          whatsapp_number: app.whatsapp_number ?? '',
        });
      }
      setDeletionRequest((deletionRes.data as Request | null) ?? null);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Could not load your settings.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!profile) return;
    setEmailPrefs({
      notify_requests: profile.notify_requests,
      notify_membership: profile.notify_membership,
      notify_experiences: profile.notify_experiences,
      notify_messages: profile.notify_messages,
    });
  }, [profile]);

  const saveEmailPrefs = useCallback(async () => {
    if (!profile) return;
    setSavingEmail(true);
    setEmailMessage(null);
    try {
      const {error} = await supabase.from('profiles').update(emailPrefs).eq('id', profile.id);
      if (error) throw new Error(error.message);
      await refreshProfile();
      setEmailMessage({tone: 'success', text: 'Email preferences saved.'});
    } catch (e) {
      setEmailMessage({tone: 'error', text: await reportError('settings.email-prefs', e)});
    } finally {
      setSavingEmail(false);
    }
  }, [emailPrefs, profile, refreshProfile]);

  const saveCommPrefs = useCallback(async () => {
    if (!applicant) {
      setCommMessage({tone: 'error', text: 'Your application record could not be found.'});
      return;
    }
    if (commPrefs.contact_whatsapp_ok && commPrefs.whatsapp_number.trim().length < 5) {
      setCommMessage({tone: 'error', text: 'Add your WhatsApp number, or turn WhatsApp off.'});
      return;
    }
    setSavingComm(true);
    setCommMessage(null);
    try {
      const {error} = await supabase
        .from('applicant_profiles')
        .update({
          contact_email_ok: commPrefs.contact_email_ok,
          contact_phone_ok: commPrefs.contact_phone_ok,
          contact_whatsapp_ok: commPrefs.contact_whatsapp_ok,
          whatsapp_number: commPrefs.contact_whatsapp_ok ? commPrefs.whatsapp_number.trim() : null,
        })
        .eq('id', applicant.id);
      if (error) throw new Error(error.message);
      setCommMessage({tone: 'success', text: 'Communication preferences saved.'});
    } catch (e) {
      setCommMessage({tone: 'error', text: e instanceof Error ? e.message : 'Could not save preferences.'});
    } finally {
      setSavingComm(false);
    }
  }, [applicant, commPrefs]);

  const changePassword = useCallback(async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const {error} = await supabase.auth.updateUser({password: newPassword});
      if (error) throw new Error(error.message);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({tone: 'success', text: 'Your password has been changed.'});
    } catch (e) {
      setPasswordMessage({tone: 'error', text: e instanceof Error ? e.message : 'Could not change your password.'});
    } finally {
      setChangingPassword(false);
    }
  }, [confirmPassword, newPassword]);

  const requestDeletion = useCallback(async () => {
    if (!session) return;
    setDeletionMessage(null);
    if (deletionReason.trim().length < 10) {
      setDeletionMessage({tone: 'error', text: 'Tell management a little more (at least 10 characters).'});
      return;
    }
    if (!confirmDeletion) {
      setDeletionMessage({tone: 'error', text: 'Please confirm that you want to request account deletion.'});
      return;
    }
    setRequestingDeletion(true);
    try {
      const {data, error} = await supabase
        .from('requests')
        .insert({
          user_id: session.user.id,
          type: 'other',
          title: 'Account deletion request',
          description: deletionReason.trim(),
          contact_method: 'email',
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      setDeletionMessage({
        tone: 'success',
        text: 'Your deletion request has been sent to management. Nothing is deleted automatically — management will contact you.',
      });
      setDeletionReason('');
      setConfirmDeletion(false);
      const {data: req} = await supabase.from('requests').select('*').eq('id', data.id).maybeSingle();
      setDeletionRequest((req as Request | null) ?? null);
    } catch (e) {
      setDeletionMessage({tone: 'error', text: e instanceof Error ? e.message : 'Could not send your request.'});
    } finally {
      setRequestingDeletion(false);
    }
  }, [confirmDeletion, deletionReason, session]);

  if (loading || profileLoading) return <FullPageLoader />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-stone pb-6">
        <p className="eyebrow mb-2">Settings</p>
        <h1 className="text-3xl md:text-4xl">Preferences & security</h1>
        <p className="mt-2 text-muted">How management communicates with you, and how you secure your account.</p>
      </div>

      {dataError ? <Alert tone="error">{dataError}</Alert> : null}

      {dataLoading ? (
        <Spinner />
      ) : (
        <>
          {/* Communication preferences */}
          <SectionCard title="Communication preferences">
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Choose how management may contact you about your account and requests.
              </p>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-gold-deep"
                  checked={commPrefs.contact_email_ok}
                  onChange={(e) => setCommPrefs((p) => ({...p, contact_email_ok: e.target.checked}))}
                />
                Management may contact me by email
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-gold-deep"
                  checked={commPrefs.contact_phone_ok}
                  onChange={(e) => setCommPrefs((p) => ({...p, contact_phone_ok: e.target.checked}))}
                />
                Management may contact me by phone
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-gold-deep"
                  checked={commPrefs.contact_whatsapp_ok}
                  onChange={(e) => setCommPrefs((p) => ({...p, contact_whatsapp_ok: e.target.checked}))}
                />
                Management may contact me on WhatsApp
              </label>
              {commPrefs.contact_whatsapp_ok ? (
                <Field label="WhatsApp number">
                  {({id}) => (
                    <input
                      id={id}
                      className="field-input"
                      placeholder="+44 7700 900000"
                      value={commPrefs.whatsapp_number}
                      onChange={(e) => setCommPrefs((p) => ({...p, whatsapp_number: e.target.value}))}
                    />
                  )}
                </Field>
              ) : null}
              {commMessage ? <Alert tone={commMessage.tone}>{commMessage.text}</Alert> : null}
              <div className="flex justify-end">
                <Button onClick={() => void saveCommPrefs()} loading={savingComm}>
                  Save communication preferences
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Email preferences */}
          <SectionCard title="Email preferences">
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <MailCheck className="size-4" aria-hidden />
                Emails are sent through Resend on behalf of Gillian Anderson Management.
              </p>
              {(
                [
                  {key: 'notify_requests', label: 'Request updates'},
                  {key: 'notify_membership', label: 'Membership updates'},
                  {key: 'notify_experiences', label: 'Experience updates'},
                  {key: 'notify_messages', label: 'Messages from management'},
                ] as Array<{key: keyof EmailPrefs; label: string}>
              ).map((option) => (
                <label key={option.key} className="flex items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-gold-deep"
                    checked={emailPrefs[option.key]}
                    onChange={(e) => setEmailPrefs((p) => ({...p, [option.key]: e.target.checked}))}
                  />
                  {option.label}
                </label>
              ))}
              {emailMessage ? <Alert tone={emailMessage.tone}>{emailMessage.text}</Alert> : null}
              <div className="flex justify-end">
                <Button onClick={() => void saveEmailPrefs()} loading={savingEmail}>
                  Save email preferences
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Security */}
          <SectionCard title="Security">
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <ShieldCheck className="size-4" aria-hidden />
                Signed in as {profile?.email}. Changing your password signs you in again on this device.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" error={passwordError ?? undefined} hint="At least 8 characters.">
                  {({id, 'aria-describedby': describedBy}) => (
                    <input
                      id={id}
                      aria-describedby={describedBy}
                      type="password"
                      autoComplete="new-password"
                      className="field-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Confirm new password">
                  {({id}) => (
                    <input
                      id={id}
                      type="password"
                      autoComplete="new-password"
                      className="field-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  )}
                </Field>
              </div>
              {passwordMessage ? <Alert tone={passwordMessage.tone}>{passwordMessage.text}</Alert> : null}
              <div className="flex justify-end">
                <Button onClick={() => void changePassword()} loading={changingPassword}>
                  <KeyRound className="size-4" aria-hidden />
                  Change password
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Account deletion */}
          <SectionCard title="Account deletion">
            <div className="space-y-4">
              {deletionMessage ? <Alert tone={deletionMessage.tone}>{deletionMessage.text}</Alert> : null}
              {deletionRequest ? (
                <Alert tone="info">
                  Your account deletion request is with management (status:{' '}
                  <strong>{deletionRequest.status}</strong>). Nothing has been deleted. Management
                  will contact you before anything changes.{' '}
                  <Link to={`/dashboard/requests/${deletionRequest.id}`} className="underline">
                    View request
                  </Link>
                </Alert>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    You can ask management to delete your account. Deletion is never automatic —
                    management reviews every request and will contact you first.
                  </p>
                  <Field label="Why are you leaving?" hint="At least 10 characters. This is seen only by management.">
                    {({id, 'aria-describedby': describedBy}) => (
                      <textarea
                        id={id}
                        aria-describedby={describedBy}
                        className="field-input min-h-24 resize-y"
                        rows={3}
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                      />
                    )}
                  </Field>
                  <label className="flex items-start gap-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-danger"
                      checked={confirmDeletion}
                      onChange={(e) => setConfirmDeletion(e.target.checked)}
                    />
                    I understand this sends a deletion request to management, and does not delete my
                    account immediately.
                  </label>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      className="text-danger"
                      onClick={() => void requestDeletion()}
                      loading={requestingDeletion}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Request account deletion
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
