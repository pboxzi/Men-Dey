import {CircleCheck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {GateHeader} from '../../components/auth/GateHeader';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage, toFunctionErrorMessage} from '../../lib/errors';
import {supabase} from '../../lib/supabase';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const {refreshProfile} = useAuth();

  const email = params.get('email') ?? '';
  const tokenHash = params.get('token_hash');
  const token = params.get('token');
  const type = params.get('type') ?? 'signup';

  // Verification links arrive with the token already in the URL, so the
  // initial state can be derived without a synchronous effect update.
  const [status, setStatus] = useState<'working' | 'verified' | 'waiting' | 'error'>(() =>
    tokenHash ? 'working' : 'waiting',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (tokenHash) {
      // Server-side OTP verification (email confirmation / recovery links).
      let active = true;

      supabase.auth
        .verifyOtp({
          type: (type === 'recovery' ? 'recovery' : 'signup') as 'signup' | 'recovery',
          token_hash: tokenHash,
        })
        .then(async ({error}) => {
          if (!active) return;
          if (error) {
            setStatus('error');
            setMessage(toFriendlyMessage(error));
            return;
          }
          await refreshProfile();
          setStatus('verified');
        })
        .catch((err: unknown) => {
          if (!active) return;
          setStatus('error');
          setMessage(toFriendlyMessage(err));
        });

      return () => {
        active = false;
      };
    }

    // No token_hash: confirmation links (?token=...) are resolved automatically
    // by detectSessionInUrl. An active session here means "already verified".
    let active = true;

    supabase.auth.getSession().then(({data}) => {
      if (active && data.session) setStatus('verified');
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === 'SIGNED_IN') setStatus('verified');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [tokenHash, token, type, refreshProfile]);

  const handleResend = async () => {
    if (!email) {
      setMessage('We could not determine your email. Sign in to request a new link.');
      return;
    }
    setResending(true);
    try {
      const {error: fnError} = await supabase.functions.invoke('send-email', {
        body: {mode: 'auth', template: 'verification', email: email.trim().toLowerCase()},
      });
      if (fnError) throw fnError;
      setResent(true);
    } catch (e) {
      setMessage(await toFunctionErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  if (status === 'working') {
    return (
      <div className="gate-flow flex min-h-[100svh] w-full flex-col items-center justify-center gap-4 px-6">
        <Spinner label="Verifying" />
        <p className="text-sm text-muted">Confirming your email address…</p>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
        <GateHeader />
        <div className="mx-auto mt-12 w-full max-w-md text-center sm:mt-16">
          <CircleCheck className="mx-auto mb-4 size-10 text-success" aria-hidden />
          <p className="eyebrow mb-2">Account created</p>
          <h1 className="mb-2 text-2xl">Email verified</h1>
          <p className="mb-7 text-sm text-muted">
            Your account is confirmed and your application is with management.
          </p>
          <Link to="/home" className="btn btn-primary">
            Continue to your home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />
      <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
        <p className="eyebrow mb-3">Almost there</p>
        <h1 className="mb-2 text-3xl">Check your email</h1>
        <p className="mb-7 text-sm text-muted">
          We sent a confirmation link{email ? ` to ${email}` : ''}. Your account must be
          verified before you can sign in — open the link to finish.
        </p>

        <div className="flex flex-col gap-4">
          {status === 'error' ? <Alert tone="error">{message}</Alert> : null}
          {resent ? <Alert tone="success">A new confirmation email has been sent.</Alert> : null}
          {message && status !== 'error' ? <Alert tone="info">{message}</Alert> : null}

          <Button variant="secondary" loading={resending} onClick={() => void handleResend()}>
            Resend verification email
          </Button>

          <Link to="/sign-in" className="btn btn-ghost">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
