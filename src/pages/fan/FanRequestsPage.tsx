import { useState, type FormEvent } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchMyRequests,
  submitFanRequest,
  type FanRequestStatus,
  type FanRequestType,
} from '../../services/fan';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/States';
import Button from '../../components/ui/Button';
import { SelectField, TextAreaField, TextField } from '../../components/ui/Field';

const TYPE_OPTIONS: Array<{ value: FanRequestType; label: string }> = [
  { value: 'general', label: 'General request' },
  { value: 'fan_letter', label: 'Fan letter' },
  { value: 'charitable', label: 'Charitable or community request' },
  { value: 'event', label: 'Event or appearance request' },
];

const STATUS_LABELS: Record<FanRequestStatus, string> = {
  pending: 'Received',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Not able to proceed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<FanRequestStatus, string> = {
  pending: 'var(--ed-muted)',
  under_review: 'var(--ed-accent-strong)',
  approved: '#245840',
  rejected: '#7E2D26',
  completed: '#245840',
  cancelled: 'var(--ed-muted)',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function FanRequestsPage() {
  const { user, profile } = useAuth();
  const [openForm, setOpenForm] = useState(false);
  const [type, setType] = useState<FanRequestType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const requests = useAsync(
    () => (user ? fetchMyRequests(user.id) : Promise.resolve({ data: [], error: null })),
    [user?.id],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const next: Record<string, string> = {};
    if (!subject.trim()) next.subject = 'Please add a short subject.';
    if (message.trim().length < 20) next.message = 'Please give us a little more detail (20 characters minimum).';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.subject ? 'req-subject' : 'req-message')?.focus();
      return;
    }

    setSubmitting(true);
    const { error } = await submitFanRequest({
      userId: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Fan',
      email: profile?.email || user.email || '',
      country: country.trim() || null,
      type,
      subject: subject.trim(),
      message: message.trim(),
      communicationChannel: null,
    });
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    setDone(true);
    setOpenForm(false);
    setSubject('');
    setMessage('');
    requests.reload();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="t-meta">Fan Area</span>
          <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
            Requests
          </h1>
          <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
            Submit a personal request to the management office and follow its status here.
            Every request is read by a person — none are guaranteed.
          </p>
        </div>
        <Button variant="primary" onClick={() => setOpenForm((v) => !v)}>
          <Plus className="h-4 w-4" /> {openForm ? 'Close Form' : 'New Request'}
        </Button>
      </header>

      {done && !openForm && (
        <div className="form-alert form-alert-success" role="status">
          Your request has been submitted. The management office will review it — you will see
          status changes listed below.
        </div>
      )}

      {openForm && (
        <form className="ed-card space-y-4 p-6" onSubmit={onSubmit} noValidate>
          <h2 className="t-h3">New request</h2>
          {formError && (
            <div className="form-alert form-alert-error" role="alert">
              {formError}
            </div>
          )}

          <SelectField
            id="req-type"
            label="Type of request"
            name="type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as FanRequestType)}
          />

          <TextField
            id="req-subject"
            label="Subject"
            name="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={errors.subject}
            invalid={Boolean(errors.subject)}
            placeholder="A short summary of your request"
          />

          <TextAreaField
            id="req-message"
            label="Your request"
            name="message"
            required
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={errors.message}
            invalid={Boolean(errors.message)}
            placeholder="Explain your request in your own words."
          />

          <TextField
            id="req-country"
            label="Country"
            name="country"
            hint="Optional — helps the office assess travel or local requests."
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Request
            </Button>
            <Button variant="ghost" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <section aria-label="Your requests">
        {requests.loading && (
          <div className="space-y-3">
            <Skeleton style={{ height: '6rem' }} />
            <Skeleton style={{ height: '6rem' }} />
          </div>
        )}
        {requests.error && (
          <ErrorState title="Requests unavailable" onRetry={requests.reload} />
        )}
        {!requests.loading && !requests.error && (requests.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No requests yet"
            description="When you submit a request it will appear here with its current status."
            action={
              <Button variant="primary" onClick={() => setOpenForm(true)}>
                Submit a Request
              </Button>
            }
          />
        )}

        <ul className="space-y-3">
          {requests.data?.map((request) => (
            <li key={request.id} className="ed-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                    {request.reference_number || 'Request'} · {formatDate(request.created_at)}
                  </p>
                  <h2 className="t-h3 mt-1" style={{ fontSize: '1.05rem' }}>
                    {request.subject || 'Untitled request'}
                  </h2>
                </div>
                <span
                  className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ borderColor: 'var(--ed-line-strong)', color: STATUS_TONE[request.status] }}
                >
                  {STATUS_LABELS[request.status] || request.status}
                </span>
              </div>

              {request.message && (
                <p className="t-body-sm mt-3" style={{ whiteSpace: 'pre-wrap', color: 'var(--ed-muted)' }}>
                  {request.message}
                </p>
              )}

              {request.admin_notes && (
                <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--ed-line)' }}>
                  <p className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                    Note from management
                  </p>
                  <p className="t-body-sm mt-1">{request.admin_notes}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
