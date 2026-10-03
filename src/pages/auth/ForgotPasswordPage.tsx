import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';

export default function ForgotPasswordPage() {
  useSeo({
    title: 'Reset Password',
    description: 'Request a password reset link for your fan account.',
    canonicalPath: '/forgot-password',
  });

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setFieldError('Please enter your email address.');
      document.getElementById('forgot-email')?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Please enter a valid email address.');
      document.getElementById('forgot-email')?.focus();
      return;
    }
    setFieldError(undefined);
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sent) {
    return (
      <div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
        >
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="t-h1 mt-5" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
          Check your inbox
        </h1>
        <p className="t-body-sm mt-3">
          If an account exists for <strong>{email}</strong>, a password reset link is on its way.
          The link expires shortly for your security.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button to="/sign-in" variant="primary">
            Back to Sign In
          </Button>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="t-meta">Account Recovery</span>
      <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
        Reset your password
      </h1>
      <p className="t-body-sm mt-3" style={{ maxWidth: '24rem' }}>
        Enter the email address on your account and we will send you a link to choose a new
        password.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="form-alert form-alert-error" role="alert">
            {error}
          </div>
        )}

        <TextField
          id="forgot-email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          invalid={Boolean(fieldError)}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Send Reset Link
        </Button>
      </form>

      <p className="t-body-sm mt-6" style={{ color: 'var(--ed-muted)' }}>
        Remembered it?{' '}
        <Link to="/sign-in" className="underline t-accent">
          Back to Sign In
        </Link>
        .
      </p>
    </div>
  );
}
