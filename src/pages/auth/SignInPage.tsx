import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../utils/AuthContext';
import Button from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';

export default function SignInPage() {
  useSeo({
    title: 'Sign In',
    description: 'Sign in to your private fan area with Gillian Anderson Management.',
    canonicalPath: '/sign-in',
  });

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={from || '/fan'} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';
    if (!password) next.password = 'Please enter your password.';
    setFieldError(next);
    setError(null);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.email ? 'signin-email' : 'signin-password')?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      document.getElementById('signin-email')?.focus();
      return;
    }
    navigate(from || '/fan', { replace: true });
  };

  return (
    <div>
      <span className="t-meta">Private Fan Access</span>
      <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)' }}>
        Welcome back
      </h1>
      <p className="t-body-sm mt-3" style={{ maxWidth: '24rem' }}>
        Sign in to read management replies, track your requests and receive official updates.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="form-alert form-alert-error" role="alert">
            {error}
          </div>
        )}

        <TextField
          id="signin-email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError.email}
          invalid={Boolean(fieldError.email)}
        />

        <TextField
          id="signin-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError.password}
          invalid={Boolean(fieldError.password)}
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-[13px] underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--ed-muted)' }}
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Sign In
        </Button>
      </form>

      <p className="t-body-sm mt-6" style={{ color: 'var(--ed-muted)' }}>
        New to Fan Access?{' '}
        <Link to="/create-account" className="underline t-accent">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
