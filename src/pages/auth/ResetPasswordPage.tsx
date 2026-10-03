import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';
import { LoadingState } from '../../components/ui/States';

export default function ResetPasswordPage() {
  useSeo({
    title: 'Choose a New Password',
    description: 'Choose a new password for your fan account.',
    canonicalPath: '/reset-password',
    noindex: true,
  });

  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = 'Please use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Both passwords must match.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.password ? 'reset-password' : 'reset-confirm')?.focus();
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingState label="Checking your reset link" />;
  }

  if (done) {
    return (
      <div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
        >
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <h1 className="t-h1 mt-5" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
          Password updated
        </h1>
        <p className="t-body-sm mt-3">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate('/fan', { replace: true })}>
            Go to My Fan Area
          </Button>
          <Button variant="secondary" size="lg" to="/sign-in">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <span className="t-meta">Account Recovery</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
          This link has expired
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '24rem' }}>
          Password reset links are single use and short lived. Request a fresh link and we will
          send it straight to your inbox.
        </p>
        <div className="mt-7">
          <Button to="/forgot-password" variant="primary" size="lg">
            Request a New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="t-meta">Account Recovery</span>
      <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
        Choose a new password
      </h1>
      <p className="t-body-sm mt-3" style={{ maxWidth: '24rem' }}>
        Pick something you have not used before. You will be signed in with it straight away.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form-alert form-alert-error" role="alert">
            {formError}
          </div>
        )}

        <TextField
          id="reset-password"
          label="New password"
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
          id="reset-confirm"
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          invalid={Boolean(errors.confirm)}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Update Password
        </Button>
      </form>

      <p className="t-body-sm mt-6" style={{ color: 'var(--ed-muted)' }}>
        Changed your mind?{' '}
        <Link to="/sign-in" className="underline t-accent">
          Back to Sign In
        </Link>
        .
      </p>
    </div>
  );
}
