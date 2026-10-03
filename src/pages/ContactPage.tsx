import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { submitInquiry, type InquiryCategory } from '../services/content';
import Button from '../components/ui/Button';
import { Field, TextAreaField, TextField } from '../components/ui/Field';

const CATEGORIES: Array<{ value: InquiryCategory; label: string; description: string }> = [
  { value: 'fan', label: 'Fan', description: 'A personal message or request from a fan' },
  { value: 'professional', label: 'Professional', description: 'Representation, work or business enquiry' },
  { value: 'media', label: 'Media', description: 'Interview, press or broadcast request' },
  { value: 'event', label: 'Event', description: 'Event organiser or appearance invitation' },
  { value: 'partnership', label: 'Partnership', description: 'Brand, charity or organisational partnership' },
  { value: 'appearance', label: 'Appearance', description: 'Speaking, convention or public appearance' },
  { value: 'other', label: 'Other', description: 'Anything else you would like to raise' },
];

interface FormState {
  name: string;
  email: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  organisation: string;
  role: string;
  website: string;
  outlet: string;
  deadline: string;
  eventDate: string;
  eventLocation: string;
  consent: boolean;
}

const INITIAL: FormState = {
  name: '',
  email: '',
  category: 'fan',
  subject: '',
  message: '',
  organisation: '',
  role: '',
  website: '',
  outlet: '',
  deadline: '',
  eventDate: '',
  eventLocation: '',
  consent: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(state: FormState): Errors {
  const errors: Errors = {};
  if (!state.name.trim()) errors.name = 'Please enter your name.';
  if (!state.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errors.email = 'Please enter a valid email address.';
  if (!state.subject.trim()) errors.subject = 'Please add a short subject.';
  if (state.message.trim().length < 20) errors.message = 'Please give us at least a little more detail (20 characters minimum).';
  if (!state.consent) errors.consent = 'Please confirm you are happy for management to respond to this address.';

  if (state.category === 'professional' && !state.organisation.trim())
    errors.organisation = 'Please tell us which organisation you are writing from.';
  if (state.category === 'media' && !state.outlet.trim())
    errors.outlet = 'Please tell us which outlet you represent.';
  if (state.category === 'appearance' && !state.eventLocation.trim())
    errors.eventLocation = 'Please tell us where the appearance would take place.';
  if (state.category === 'event' && !state.eventLocation.trim())
    errors.eventLocation = 'Please tell us where the event would take place.';

  return errors;
}

export default function ContactPage() {
  useSeo({
    title: 'Contact Management',
    description:
      'Contact Gillian\'s management for professional enquiries, appearances, media requests, partnerships and fan communication.',
    canonicalPath: '/contact',
  });

  const [state, setState] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const found = validate(state);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      document.getElementById(`contact-${firstKey}`)?.focus();
      return;
    }

    setStatus('submitting');
    const res = await submitInquiry({
      name: state.name.trim(),
      email: state.email.trim(),
      category: state.category,
      subject: state.subject.trim(),
      message: state.message.trim(),
    });

    if (res.error) {
      setStatus('error');
      setServerError('Your message could not be sent. Please try again, or email the management office directly.');
      return;
    }
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <section className="ed-shell" style={{ paddingTop: 'clamp(4rem,10vw,7rem)', paddingBottom: 'clamp(4rem,10vw,7rem)' }}>
        <div className="ed-shell-narrow text-center" style={{ paddingInline: 0 }}>
          <div className="state-icon" style={{ marginInline: 'auto', background: 'var(--ed-success-soft)', color: 'var(--ed-success)' }}>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="t-h1 mt-6">Thank you, {state.name.split(' ')[0]}</h1>
          <p className="t-body mt-4">
            Your message has been received by Gillian's management. Every enquiry is reviewed by the
            management team. If a response is appropriate, you will hear from us at{' '}
            <strong style={{ color: 'var(--ed-ink)' }}>{state.email}</strong>.
          </p>
          <p className="t-caption mt-4">
            Management reviews each message individually — sending follow-ups will not speed up a response.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/" variant="secondary">
              Back to website
            </Button>
            <Button to="/fan-access" variant="primary">
              Explore Fan Access
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="ed-shell"
        style={{ paddingTop: 'clamp(4rem,10vw,7rem)', paddingBottom: 'clamp(2.5rem,5vw,3.5rem)' }}
      >
        <span className="t-meta">Contact</span>
        <h1 className="t-h1 mt-3">Contact Gillian's Management</h1>
        <p className="t-body mt-5" style={{ maxWidth: '42rem' }}>
          The management office handles professional enquiries, appearances, media requests,
          partnerships and communication with fans. Choose the category that fits and the form will
          ask only for what is relevant.
        </p>
        <p className="t-caption mt-3" style={{ maxWidth: '42rem' }}>
          Messages go to management — not directly to Gillian. Management reviews every enquiry and
          responds where appropriate.
        </p>
      </section>

      <section className="ed-shell pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {serverError && (
              <div className="form-alert form-alert-error" role="alert">
                {serverError}
              </div>
            )}

            {/* Category */}
            <fieldset className="space-y-3">
              <legend className="t-label mb-1">What is this regarding?</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat.value} className="choice-card">
                    <input
                      type="radio"
                      name="contact-category"
                      value={cat.value}
                      checked={state.category === cat.value}
                      onChange={() => set('category', cat.value)}
                    />
                    <span>
                      <span className="choice-card-title">{cat.label}</span>
                      <span className="choice-card-desc">{cat.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <hr className="ed-rule" />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Your name"
                name="name"
                id="contact-name"
                autoComplete="name"
                required
                value={state.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
              />
              <TextField
                label="Email address"
                name="email"
                id="contact-email"
                type="email"
                autoComplete="email"
                required
                value={state.email}
                onChange={(e) => set('email', e.target.value)}
                error={errors.email}
              />
            </div>

            {/* Category-specific fields */}
            {(state.category === 'professional' || state.category === 'partnership') && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Organisation"
                  name="organisation"
                  id="contact-organisation"
                  autoComplete="organization"
                  required={state.category === 'professional'}
                  value={state.organisation}
                  onChange={(e) => set('organisation', e.target.value)}
                  error={errors.organisation}
                  hint="The company, agency or organisation you represent."
                />
                <TextField
                  label="Your role"
                  name="role"
                  id="contact-role"
                  autoComplete="organization-title"
                  value={state.role}
                  onChange={(e) => set('role', e.target.value)}
                  error={errors.role}
                />
                <TextField
                  label="Website"
                  name="website"
                  id="contact-website"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={state.website}
                  onChange={(e) => set('website', e.target.value)}
                  error={errors.website}
                  wrapClassName="sm:col-span-2"
                />
              </div>
            )}

            {state.category === 'media' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Outlet"
                  name="outlet"
                  id="contact-outlet"
                  required
                  value={state.outlet}
                  onChange={(e) => set('outlet', e.target.value)}
                  error={errors.outlet}
                  hint="Publication, broadcaster or platform."
                />
                <TextField
                  label="Deadline"
                  name="deadline"
                  id="contact-deadline"
                  type="date"
                  value={state.deadline}
                  onChange={(e) => set('deadline', e.target.value)}
                  error={errors.deadline}
                />
              </div>
            )}

            {(state.category === 'appearance' || state.category === 'event') && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Location"
                  name="eventLocation"
                  id="contact-eventLocation"
                  required
                  value={state.eventLocation}
                  onChange={(e) => set('eventLocation', e.target.value)}
                  error={errors.eventLocation}
                  hint="City and venue, if known."
                />
                <TextField
                  label="Proposed date"
                  name="eventDate"
                  id="contact-eventDate"
                  type="date"
                  value={state.eventDate}
                  onChange={(e) => set('eventDate', e.target.value)}
                  error={errors.eventDate}
                />
              </div>
            )}

            <TextField
              label="Subject"
              name="subject"
              id="contact-subject"
              required
              value={state.subject}
              onChange={(e) => set('subject', e.target.value)}
              error={errors.subject}
            />

            <TextAreaField
              label="Message"
              name="message"
              id="contact-message"
              required
              rows={7}
              value={state.message}
              onChange={(e) => set('message', e.target.value)}
              error={errors.message}
              hint={
                state.category === 'fan'
                  ? 'Write as much or as little as you like — management reads every message.'
                  : 'Include the key details management will need to assess this enquiry.'
              }
            />

            <Field
              label="Consent"
              htmlFor="contact-consent"
              error={errors.consent}
              hint="Your details are used only to respond to this enquiry."
            >
              <label className="choice" htmlFor="contact-consent">
                <input
                  type="checkbox"
                  id="contact-consent"
                  checked={state.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  aria-invalid={Boolean(errors.consent) || undefined}
                />
                <span>
                  I am happy for Gillian's management to contact me about this enquiry.
                </span>
              </label>
            </Field>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button type="submit" variant="primary" size="lg" loading={status === 'submitting'}>
                Send to Management
              </Button>
              <span className="t-caption">All communication is handled with discretion.</span>
            </div>
          </form>

          {/* Aside */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="ed-card p-6">
              <h2 className="t-h3" style={{ fontSize: '1.15rem' }}>
                What management handles
              </h2>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Professional enquiries and representation',
                  'Appearance and event invitations',
                  'Media and press requests',
                  'Partnerships and collaborations',
                  'Fan-related communication',
                ].map((line) => (
                  <li key={line} className="t-body-sm flex gap-2.5">
                    <span className="t-accent" aria-hidden="true">
                      —
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ed-card p-6" style={{ background: 'var(--ed-bg-alt)' }}>
              <h2 className="t-h3" style={{ fontSize: '1.15rem' }}>
                Looking for your own space?
              </h2>
              <p className="t-body-sm mt-3">
                Fans can create a private account to send messages, submit requests and receive
                official updates.
              </p>
              <Button to="/fan-access" variant="secondary" size="sm" className="mt-4">
                Explore Fan Access
              </Button>
            </div>

            <p className="t-caption">
              Please note: management does not accept unsolicited scripts or submissions sent
              through this form.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
