import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Card} from '../../components/ui/Card';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {toFriendlyMessage} from '../../lib/errors';

export function SignInPage() {
  const {loading: authLoading, isAuthenticated, role, signIn} = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return <FullPageLoader />;

  if (isAuthenticated) {
    const next = params.get('next');
    const target = next && next.startsWith('/') ? next : role === 'admin' || role === 'management' ? '/management' : '/home';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const next = params.get('next');
      navigate(next && next.startsWith('/') ? next : '/home', {replace: true});
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <p className="eyebrow mb-3">Private access</p>
      <h1 className="mb-2 text-3xl md:text-4xl">Sign in</h1>
      <p className="mb-8 text-sm text-muted">
        Access your requests, membership and approved experiences.
      </p>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
          {error ? <Alert tone="error">{error}</Alert> : null}

          <Field label="Email">
            {(props) => (
              <input
                {...props}
                className="field-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>

          <Field label="Password">
            {(props) => (
              <input
                {...props}
                className="field-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>

          <Button type="submit" loading={submitting}>
            Sign in
          </Button>

          <div className="flex items-center justify-between text-xs text-muted">
            <Link to="/forgot-password" className="underline-offset-2 hover:text-gold-deep hover:underline">
              Forgot password?
            </Link>
            <Link to="/acknowledgement" className="underline-offset-2 hover:text-gold-deep hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
