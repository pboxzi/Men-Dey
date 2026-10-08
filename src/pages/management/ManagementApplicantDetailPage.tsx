import {ArrowLeft, Check, Eye, X} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate, formatDateTime} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import {INTEREST_LABELS} from '../auth/application/interests';
import {APPLICANT_STATUS_LABELS, APPLICANT_STATUS_TONES} from './shared';
import type {ApplicantProfile, Profile} from '../../types';

interface ApplicantData {
  applicant: ApplicantProfile | null;
  user: Profile | null;
}

const EMPTY: ApplicantData = {applicant: null, user: null};

export function ManagementApplicantDetailPage() {
  const {id = ''} = useParams();
  const {session} = useAuth();

  const [data, setData] = useState<ApplicantData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<'approve' | 'reject' | 'review' | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const applicantRes = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (applicantRes.error) throw new Error(applicantRes.error.message);
      const applicant = (applicantRes.data as ApplicantProfile | null) ?? null;
      let user: Profile | null = null;
      if (applicant) {
        const userRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', applicant.user_id)
          .maybeSingle();
        if (userRes.error) throw new Error(userRes.error.message);
        user = (userRes.data as Profile | null) ?? null;
      }
      setData({applicant, user});
      setReviewNotes(applicant?.review_notes ?? '');
      setConfirming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyStatus = useCallback(
    async (
      nextStatus: ApplicantProfile['status'],
      extra: Partial<ApplicantProfile>,
      failureMessage: string,
    ) => {
      setBusy(true);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('applicant_profiles')
          .update({status: nextStatus, ...extra})
          .eq('id', id)
          .select('id, status')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated) throw new Error(failureMessage);
        setNotice(`Application marked ${APPLICANT_STATUS_LABELS[nextStatus].toLowerCase()}.`);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : failureMessage);
      } finally {
        setBusy(false);
        setConfirming(null);
      }
    },
    [id, load],
  );

  const startReview = useCallback(
    () =>
      applyStatus(
        'in_review',
        {},
        'The review could not be started. This action requires the requests.manage permission.',
      ),
    [applyStatus],
  );

  const approve = useCallback(() => {
    const me = session?.user.id;
    if (!me) {
      setActionError('You are not signed in.');
      return;
    }
    return applyStatus(
      'approved',
      {
        reviewed_by: me,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes.trim() || null,
      },
      'The approval was not saved. This action requires the requests.manage permission.',
    );
  }, [applyStatus, reviewNotes, session]);

  const reject = useCallback(() => {
    if (!reviewNotes.trim()) {
      setActionError('Add review notes explaining the decision before rejecting.');
      return;
    }
    const me = session?.user.id;
    if (!me) {
      setActionError('You are not signed in.');
      return;
    }
    return applyStatus(
      'rejected',
      {
        reviewed_by: me,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes.trim(),
      },
      'The rejection was not saved. This action requires the requests.manage permission.',
    );
  }, [applyStatus, reviewNotes, session]);

  const saveNotes = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const me = session?.user.id;
      if (!me) throw new Error('You are not signed in.');
      const {data: updated, error: updateError} = await supabase
        .from('applicant_profiles')
        .update({review_notes: reviewNotes.trim() || null, reviewed_by: me})
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);
      if (!updated)
        throw new Error('The notes were not saved. This action requires the requests.manage permission.');
      setNotice('Review notes saved.');
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not save the notes.');
    } finally {
      setBusy(false);
    }
  }, [id, load, reviewNotes, session]);

  if (loading) return <Spinner label="Loading application" />;

  const {applicant, user} = data;
  if (!applicant) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Applicants" title="Application not found" />
        <EmptyState
          title="No application here."
          description="This application may have been removed, or the link is out of date."
        />
        <Link to="/management/applicants" className="text-sm text-gold-deep hover:underline">
          Back to applicants
        </Link>
      </div>
    );
  }

  const answers: Array<{label: string; value: string}> = [
    {label: 'Headline', value: applicant.headline ?? ''},
    {label: 'Background', value: applicant.background ?? ''},
    {label: 'Interests', value: applicant.interests ?? ''},
    {label: 'Reason for joining', value: applicant.reason_for_joining ?? ''},
    {label: 'Platform motivation', value: applicant.platform_motivation ?? ''},
    {label: 'Connection interest', value: applicant.connection_interest ?? ''},
    {label: 'WhatsApp number', value: applicant.whatsapp_number ?? ''},
    {label: 'Referred by', value: applicant.referred_by ?? ''},
  ].filter((row) => row.value);

  const contactMethods = [
    applicant.contact_email_ok ? 'Email' : null,
    applicant.contact_phone_ok ? 'Phone' : null,
    applicant.contact_whatsapp_ok ? 'WhatsApp' : null,
  ].filter(Boolean) as string[];

  const timeline: Array<{label: string; value: string}> = [
    {label: 'Started', value: formatDate(applicant.created_at)},
    {label: 'Application completed', value: formatDate(applicant.application_completed_at)},
    {label: 'Submitted', value: formatDate(applicant.submitted_at)},
    {label: 'Reviewed', value: formatDateTime(applicant.reviewed_at)},
  ].filter((row) => row.value);

  const canReview = ['new', 'draft', 'submitted'].includes(applicant.status);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Applicants"
        title={user?.full_name || user?.email || applicant.headline || 'Application'}
        description={user?.email ?? undefined}
        actions={
          <Link to="/management/applicants" className="btn btn-ghost">
            <ArrowLeft className="size-4" aria-hidden /> All applicants
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={APPLICANT_STATUS_TONES[applicant.status]}>
          {APPLICANT_STATUS_LABELS[applicant.status]}
        </Chip>
        <Link to={`/management/fans/${applicant.user_id}`} className="text-xs text-gold-deep hover:underline">
          View fan account
        </Link>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <section className="surface p-4 sm:p-6 lg:col-span-2" aria-label="Application answers">
          <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Application answers
          </h2>
          {answers.length === 0 ? (
            <p className="text-sm text-muted">This application has no written answers yet.</p>
          ) : (
            <dl className="space-y-4">
              {answers.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs uppercase tracking-wider text-muted">{row.label}</dt>
                  <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-charcoal">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 border-t border-stone pt-4">
            <p className="text-xs uppercase tracking-wider text-muted">Experience interests</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {applicant.experience_interests.length === 0 ? (
                <span className="text-sm text-muted">None selected.</span>
              ) : (
                applicant.experience_interests.map((interest) => (
                  <Chip key={interest} tone="neutral">
                    {INTEREST_LABELS[interest] ?? interest}
                  </Chip>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-stone pt-4">
            <p className="text-xs uppercase tracking-wider text-muted">Happy to be contacted by</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {contactMethods.length === 0 ? (
                <span className="text-sm text-muted">No contact methods selected.</span>
              ) : (
                contactMethods.map((method) => (
                  <Chip key={method} tone="info">
                    {method}
                  </Chip>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="surface p-4 sm:p-6" aria-label="Timeline">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Timeline
            </h2>
            <dl className="space-y-3">
              {timeline.map((row) => (
                <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-3">
                  <dt className="text-xs uppercase tracking-wider text-muted">{row.label}</dt>
                  <dd className="break-words text-sm text-charcoal">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface p-4 sm:p-6" aria-label="Review">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
              Review decision
            </h2>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Review notes
              </span>
              <textarea
                className="field-input min-h-24 resize-y"
                rows={4}
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void saveNotes()} loading={busy}>
                Save notes
              </Button>
            </div>

            <div className="mt-5 space-y-3 border-t border-stone pt-4">
              {canReview ? (
                confirming === 'review' ? (
                  <div className="rounded-sm border border-stone bg-stone/40 p-3">
                    <p className="text-sm text-charcoal">Move this application into review?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => setConfirming(null)}>
                        Back
                      </Button>
                      <Button loading={busy} onClick={startReview}>
                        Start review
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirming('review')}>
                    <Eye className="size-4" aria-hidden /> Start review
                  </Button>
                )
              ) : null}

              {['in_review', 'submitted'].includes(applicant.status) ? (
                confirming === 'approve' ? (
                  <div className="rounded-sm border border-stone bg-stone/40 p-3">
                    <p className="text-sm text-charcoal">
                      Approve this applicant? They move forward to membership and experiences.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => setConfirming(null)}>
                        Back
                      </Button>
                      <Button loading={busy} onClick={approve}>
                        Confirm approval
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setConfirming('approve')}>
                    <Check className="size-4" aria-hidden /> Approve
                  </Button>
                )
              ) : null}

              {['new', 'draft', 'submitted', 'in_review'].includes(applicant.status) ? (
                confirming === 'reject' ? (
                  <div className="rounded-sm border border-stone bg-stone/40 p-3">
                    <p className="text-sm text-charcoal">
                      Reject this application? The decision and your notes are recorded — nothing is
                      deleted.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => setConfirming(null)}>
                        Back
                      </Button>
                      <Button loading={busy} onClick={reject}>
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={() => setConfirming('reject')}>
                    <X className="size-4" aria-hidden /> Reject
                  </Button>
                )
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
