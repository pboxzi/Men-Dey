import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import { Checkbox, TextField } from '../../components/ui/Field';

interface PendingConfirmation {
  email: string;
  userId: string;
  name: string;
  country: string;
}

const PENDING_KEY = 'pending_confirmation';

export default function CreateAccountPage() {
  useSeo({
    title: 'Create Account',
    description: 'Create your private fan account with Gillian Anderson Management.',
    canonicalPath: '/create-account',
  });

  const { signUp, user, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  if (!loading && user) {
    return <Navigate to="/fan" replace />;
  }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!email.trim()) next.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';
    if (password.length < 8) next.password = 'Please use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Both passwords must match.';
    if (!consent) next.consent = 'Please confirm you accept the privacy policy and terms.';
    return next;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    const keys = Object.keys(next);
    if (keys.length > 0) {
      document.getElementById(`ca-${keys[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim(), {
      country: country.trim() || undefined,
    });
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    const pending: PendingConfirmation = {
      email: email.trim(),
      userId: result.user?.id ?? '',
      name: name.trim(),
      country: country.trim() || 'Global',
    };
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      /* storage unavailable — resend simply won't be prefilled */
    }
    setSentTo(pending.email);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resend = async () => {
    let pending: PendingConfirmation | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      pending = raw ? (JSON.parse(raw) as PendingConfirmation) : null;
    } catch {
      /* unreadable storage — treated as no pending confirmation */
    }

    if (!pending || pending.email !== sentTo || !pending.userId) {
      setResendState('error');
      return;
    }

    setResendState('sending');
    try {
      const { error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: pending.email,
          userId: pending.userId,
          userName: pending.name,
          country: pending.country,
          city: '',
          howHeardAbout: '',
          favoriteThing: '',
        },
      });
      setResendState(error ? 'error' : 'done');
    } catch {
      setResendState('error');
    }
  };

  if (sentTo) {
    return (
      <div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
        >
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="t-h1 mt-5" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
          Confirm your email
        </h1>
        <p className="t-body-sm mt-3">
          We have sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your
          account, then sign in.
        </p>

        <div className="mt-7 space-y-4">
          <div className="ed-card p-5">
            <p className="t-body-sm">
              Nothing arriving? Check your spam folder, or resend the confirmation email.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={resend}
                loading={resendState === 'sending'}
                disabled={resendState === 'done'}
              >
                {resendState === 'done' ? 'Email sent' : 'Resend confirmation email'}
              </Button>
              <Link to="/sign-in" className="text-[13px] underline t-accent">
                Go to sign in
              </Link>
            </div>
            {resendState === 'error' && (
              <p className="t-caption mt-3" style={{ color: 'var(--ed-danger)' }}>
                We could not resend automatically. Please{' '}
                <Link to="/contact" className="underline">
                  contact the management office
                </Link>{' '}
                and we will help you directly.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="t-meta">Private Fan Access</span>
      <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
        Create your account
      </h1>
      <p className="t-body-sm mt-3" style={{ maxWidth: '24rem' }}>
        A free account gives you your own fan area for messages, requests and official updates.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form-alert form-alert-error" role="alert">
            {formError}
          </div>
        )}

        <TextField
          id="ca-name"
          label="Full name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          invalid={Boolean(errors.name)}
        />

        <TextField
          id="ca-email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          invalid={Boolean(errors.email)}
        />

        <TextField
          id="ca-country"
          label="Country"
          name="country"
          autoComplete="country-name"
          hint="Optional — helps the management office understand where fans are based."
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

        <TextField
          id="ca-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          invalid={Boolean(errors.password)}
        />

        <TextField
          id="ca-confirm"
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          invalid={Boolean(errors.confirm)}
        />

        <div className="field">
          <Checkbox
            id="ca-consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label={
              <span className="text-[13px] leading-relaxed" style={{ color: 'var(--ed-muted)' }}>
                I have read the{' '}
                <Link to="/privacy" className="underline t-accent">
                  privacy policy
                </Link>{' '}
                and{' '}
                <Link to="/terms" className="underline t-accent">
                  terms
                </Link>
                , and I agree to receive account and management emails.
              </span>
            }
          />
          {errors.consent && (
            <p className="field-error" role="alert">
              {errors.consent}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Create Account
        </Button>
      </form>

      <p className="t-body-sm mt-6" style={{ color: 'var(--ed-muted)' }}>
        Already have an account?{' '}
        <Link to="/sign-in" className="underline t-accent">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
