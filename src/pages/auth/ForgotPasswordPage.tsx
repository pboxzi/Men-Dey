import {useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';

import {GateHeader} from '../../components/auth/GateHeader';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {reportError} from '../../lib/errors';
import {supabase} from '../../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const {error: fnError} = await supabase.functions.invoke('send-email', {
        body: {
          mode: 'auth',
          template: 'password_reset',
          email: email.trim().toLowerCase(),
        },
      });
      if (fnError) throw fnError;
      setSent(true);
    } catch (e) {
      setError(await reportError('forgot-password', e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />
      <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
        <p className="eyebrow mb-3">Account recovery</p>
        <h1 className="mb-2 text-3xl">Reset your password</h1>
        <p className="mb-7 text-sm text-muted">
          Enter your account email and we will send a secure reset link.
        </p>

        {sent ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">
              If an account exists for {email}, a reset link is on its way. Check your inbox.
            </Alert>
            <Link to="/sign-in" className="btn btn-secondary">
              Back to sign in
            </Link>
          </div>
        ) : (
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

            <Button type="submit" loading={submitting}>
              Send reset link
            </Button>

            <Link
              to="/sign-in"
              className="text-center text-xs text-muted underline-offset-2 hover:text-[#C89B3C] hover:underline sm:text-left"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
