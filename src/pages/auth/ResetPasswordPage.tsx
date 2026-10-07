import {useState, useEffect, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {GateHeader} from '../../components/auth/GateHeader';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage} from '../../lib/errors';
import {supabase} from '../../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const {refreshProfile} = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const code = search.get('code');
    const tokenHash = search.get('token_hash');
    let active = true;

    const finish = (ok: boolean, err?: unknown) => {
      if (!active) return;
      setChecking(false);
      if (ok) {
        setSessionReady(true);
      } else {
        setError(err ? toFriendlyMessage(err) : 'This reset link is invalid or has expired.');
      }
    };

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(async ({error}) => {
          if (!error) await refreshProfile();
          finish(!error, error);
        })
        .catch((err: unknown) => finish(false, err));
    } else if (tokenHash) {
      supabase.auth
        .verifyOtp({type: 'recovery', token_hash: tokenHash})
        .then(async ({error}) => {
          if (!error) await refreshProfile();
          finish(!error, error);
        })
        .catch((err: unknown) => finish(false, err));
    } else {
      supabase.auth.getSession().then(({data}) => finish(Boolean(data.session)));
    }

    return () => {
      active = false;
    };
  }, [refreshProfile]);

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
    const {error: updateError} = await supabase.auth.updateUser({password});
    setSubmitting(false);
    if (updateError) {
      setError(toFriendlyMessage(updateError));
      return;
    }
    navigate('/home', {replace: true});
  };

  if (checking) {
    return (
      <div className="gate-flow flex min-h-[100svh] w-full items-center justify-center px-6">
        <Spinner label="Validating reset link" />
      </div>
    );
  }

  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />
      <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
        <p className="eyebrow mb-3">Account recovery</p>
        <h1 className="mb-2 text-3xl">Choose a new password</h1>
        <p className="mb-7 text-sm text-muted">This password replaces your previous one.</p>

        {error ? (
          <div className="flex flex-col gap-4">
            <Alert tone="error">{error}</Alert>
            <Link to="/forgot-password" className="btn btn-secondary">
              Request a new link
            </Link>
          </div>
        ) : null}

        {sessionReady ? (
          <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
            <Field label="New password" hint="At least 8 characters.">
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

            <Field label="Confirm new password">
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
              Update password
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
