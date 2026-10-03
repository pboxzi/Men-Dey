import { CheckCircle2 } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo';
import { useAuth } from '../../utils/AuthContext';
import Button from '../../components/ui/Button';

export default function EmailVerifiedPage() {
  useSeo({
    title: 'Email Verified',
    description: 'Your email address has been verified.',
    canonicalPath: '/email-verified',
    noindex: true,
  });

  const { session, user } = useAuth();
  const signedIn = Boolean(session && user);

  return (
    <div className="text-center">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'var(--ed-success-soft)', color: '#245840' }}
        aria-hidden="true"
      >
        <CheckCircle2 className="h-5 w-5" />
      </span>

      <h1 className="t-h1 mt-5" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
        Email verified
      </h1>
      <p className="t-body-sm mx-auto mt-3" style={{ maxWidth: '24rem' }}>
        Thank you — your email address has been confirmed. Your fan area is ready when you are.
      </p>

      <div className="mt-7 flex flex-col items-center gap-3">
        <Button variant="primary" size="lg" to={signedIn ? '/fan' : '/sign-in'} replace>
          {signedIn ? 'Enter Your Fan Area' : 'Sign In'}
        </Button>
        {!signedIn && (
          <Button variant="ghost" to="/" replace>
            Back to Website
          </Button>
        )}
      </div>
    </div>
  );
}
