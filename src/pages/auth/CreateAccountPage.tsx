import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';

import {getStoredAck} from '../../auth/ack';
import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Card} from '../../components/ui/Card';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {toFriendlyMessage} from '../../lib/errors';

export function CreateAccountPage() {
  const {loading: authLoading, isAuthenticated, signUp} = useAuth();
  const navigate = useNavigate();
  const ack = getStoredAck();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  if (!ack) return <Navigate to="/acknowledgement" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        ackVersion: ack.version,
        ackAt: ack.at,
      });
      if (result.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, {replace: true});
      } else {
        navigate('/home', {replace: true});
      }
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <p className="eyebrow mb-3">Step 2 of 2 · Acknowledged version {ack.version}</p>
      <h1 className="mb-2 text-3xl md:text-4xl">Create your account</h1>
      <p className="mb-8 text-sm text-muted">
        Your acknowledgement (version {ack.version}) will be recorded with your registration.
      </p>

      <Card>
        <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
          {error ? <Alert tone="error">{error}</Alert> : null}

          <Field label="Full name">
            {(props) => (
              <input
                {...props}
                className="field-input"
                autoComplete="name"
                required
                maxLength={200}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            )}
          </Field>

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

          <Field label="Password" hint="At least 8 characters.">
            {(props) => (
              <input
                {...props}
                className="field-input"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>

          <Field label="Confirm password">
            {(props) => (
              <input
                {...props}
                className="field-input"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            )}
          </Field>

          <Button type="submit" loading={submitting}>
            Create account
          </Button>

          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-gold-deep underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
