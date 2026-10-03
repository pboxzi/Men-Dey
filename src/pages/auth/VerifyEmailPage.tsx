import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';

type Status = 'working' | 'success' | 'error';

/**
 * Landing page for email confirmation links.
 * Handles the custom token issued by the `confirm-email` edge function
 * as well as Supabase's native `token_hash` links.
 * Also mounted at /confirm-email for links already sent.
 */
export default function VerifyEmailPage() {
  useSeo({
    title: 'Verify Your Email',
    description: 'Confirm your email address to activate your fan account.',
    canonicalPath: '/verify-email',
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const { refreshProfile, session, user } = useAuth();
  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = searchParams.get('token');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    const run = async () => {
      try {
        if (token) {
          const { data, error } = await supabase.functions.invoke('confirm-email', {
            body: { token },
          });
          if (error) {
            setStatus('error');
            setMessage(error.message || 'Confirmation failed. Please try again.');
            return;
          }
          if (data?.success) {
            await refreshProfile();
            setStatus('success');
            setMessage('Your email is confirmed. You can now sign in to your account.');
          } else {
            setStatus('error');
            setMessage(data?.error || 'This confirmation link is invalid or has expired.');
          }
          return;
        }

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: (type as 'signup' | 'recovery' | 'email_change') || 'signup',
            token_hash: tokenHash,
          });
          if (error) {
            setStatus('error');
            setMessage(error.message || 'This verification link is invalid or has expired.');
            return;
          }
          await refreshProfile();
          setStatus('success');
          setMessage('Your email is confirmed. You can now sign in to your account.');
          return;
        }

        setStatus('error');
        setMessage('This verification link is incomplete. Please open the link from your email.');
      } catch {
        setStatus('error');
        setMessage('Something went wrong confirming your email. Please try again shortly.');
      }
    };

    run();
  }, [searchParams, refreshProfile]);

  const signedIn = Boolean(session && user);

  return (
    <div className="text-center">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background:
            status === 'success'
              ? 'var(--ed-success-soft)'
              : status === 'error'
                ? 'var(--ed-danger-soft)'
                : 'var(--ed-accent-soft)',
          color:
            status === 'success'
              ? '#245840'
              : status === 'error'
                ? '#7E2D26'
                : 'var(--ed-accent-strong)',
        }}
        aria-hidden="true"
      >
        {status === 'working' && <Loader2 className="h-5 w-5" style={{ animation: 'spin 1s linear infinite' }} />}
        {status === 'success' && <CheckCircle2 className="h-5 w-5" />}
        {status === 'error' && <XCircle className="h-5 w-5" />}
      </span>

      <h1 className="t-h1 mt-5" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
        {status === 'working' && 'Confirming your email'}
        {status === 'success' && 'Email confirmed'}
        {status === 'error' && 'Confirmation failed'}
      </h1>

      <p
        className="t-body-sm mx-auto mt-3"
        style={{ maxWidth: '24rem', color: status === 'working' ? 'var(--ed-muted)' : undefined }}
        role={status === 'working' ? 'status' : 'alert'}
        aria-live="polite"
      >
        {status === 'working'
          ? 'Verifying your account, this only takes a moment.'
          : message}
      </p>

      {status === 'success' && (
        <div className="mt-7">
          <Button
            variant="primary"
            size="lg"
            to={signedIn ? '/fan' : '/sign-in'}
            replace
          >
            {signedIn ? 'Enter Your Fan Area' : 'Sign In'}
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button to="/create-account" variant="secondary" size="lg">
            Create a New Account
          </Button>
          <Link to="/contact" className="text-[13px] underline t-accent">
            Contact the management office
          </Link>
        </div>
      )}
    </div>
  );
}
