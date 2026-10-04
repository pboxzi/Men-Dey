import {CircleCheck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Card} from '../../components/ui/Card';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage} from '../../lib/errors';
import {supabase} from '../../lib/supabase';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {session, refreshProfile} = useAuth();

  const [status, setStatus] = useState<'working' | 'verified' | 'waiting' | 'error'>('waiting');
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const email = params.get('email') ?? '';
  const tokenHash = params.get('token_hash');
  const token = params.get('token');
  const type = params.get('type') ?? 'signup';

  useEffect(() => {
    if (!tokenHash) {
      // Supabase Auth confirmation links (?token=...) are resolved automatically
      // by detectSessionInUrl — wait for the session to arrive instead.
      if (!token) return undefined;
      let done = false;
      const {
        data: {subscription},
      } = supabase.auth.onAuthStateChange((event) => {
        if (!done && event === 'SIGNED_IN') {
          done = true;
          setStatus('verified');
        }
      });
      supabase.auth.getSession().then(({data}) => {
        if (!done && data.session) {
          done = true;
          setStatus('verified');
        }
      });
      return () => subscription.unsubscribe();
    }

    let active = true;
    setStatus('working');

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
  }, [tokenHash, token, type, refreshProfile]);

  useEffect(() => {
    if (status === 'verified' && session) {
      const timer = setTimeout(() => navigate('/home', {replace: true}), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, session, navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const {error} = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {emailRedirectTo: `${window.location.origin}/verify-email`},
    });
    setResending(false);
    if (error) {
      setMessage(toFriendlyMessage(error));
    } else {
      setResent(true);
    }
  };

  if (status === 'working') {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24">
        <Spinner label="Verifying" />
        <p className="text-sm text-muted">Confirming your email address…</p>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-24">
        <Card className="text-center">
          <CircleCheck className="mx-auto mb-4 size-10 text-success" aria-hidden />
          <h1 className="mb-2 text-2xl">Email verified</h1>
          <p className="text-sm text-muted">Your account is confirmed. Taking you inside…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <p className="eyebrow mb-3">Verify your email</p>
      <h1 className="mb-2 text-3xl">Check your inbox</h1>
      <p className="mb-8 text-sm text-muted">
        We sent a confirmation link{email ? ` to ${email}` : ''}. Open it to activate your
        account.
      </p>

      <Card className="flex flex-col gap-4">
        {status === 'error' ? <Alert tone="error">{message}</Alert> : null}
        {resent ? <Alert tone="success">A new confirmation email has been sent.</Alert> : null}
        {message && status !== 'error' ? <Alert tone="info">{message}</Alert> : null}

        {email ? (
          <Button variant="secondary" loading={resending} onClick={() => void handleResend()}>
            Resend confirmation email
          </Button>
        ) : null}

        <Link to="/sign-in" className="btn btn-ghost">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
