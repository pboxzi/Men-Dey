import {ArrowRight} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {GateHeader} from '../../components/auth/GateHeader';
import {Alert} from '../../components/ui/Alert';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage} from '../../lib/errors';

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export function SignInPage() {
  const {loading: authLoading, isAuthenticated, role, signIn} = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduce = useReducedMotion() === true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rise = (delay: number) => ({
    initial: reduce ? {opacity: 1, y: 0} : {opacity: 0, y: 16},
    animate: {opacity: 1, y: 0},
    transition: {
      duration: reduce ? 0 : 0.65,
      delay: reduce ? 0 : delay,
      ease: EASE,
    },
  });

  if (authLoading) return <FullPageLoader />;

  if (isAuthenticated) {
    const next = params.get('next');
    const target =
      next && next.startsWith('/')
        ? next
        : role === 'admin' || role === 'management'
          ? '/management'
          : '/home';
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
    <div className="gate-flow relative flex min-h-[100svh] w-full flex-col px-6 pb-9 pt-8 sm:px-10 sm:pb-11 sm:pt-10 lg:px-16 lg:pt-14">
      <motion.div {...rise(0.1)}>
        <GateHeader />
      </motion.div>

      <div className="flex flex-1 items-center py-8 sm:py-10">
        <motion.div {...rise(0.26)} className="w-full max-w-[27rem]">
          <p className="eyebrow mb-2">Welcome back</p>
          <h1 className="mb-2 font-display text-3xl uppercase leading-tight sm:text-[2.1rem]">
            Sign in
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-muted">
            Your requests, membership and approved experiences are waiting for you &mdash;
            we&rsquo;re glad you&rsquo;re back.
          </p>

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

            <div className="-mt-2 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted underline-offset-2 transition-colors hover:text-[#C89B3C] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="gate-btn-primary w-full"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? <Spinner label="Signing in" /> : null}
              Sign in
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </button>
          </form>

          <div className="mt-5 border-t border-[#EAE4DA]/20 pt-4 text-center text-xs text-muted sm:text-left">
            New here? We&rsquo;d love to have you.{' '}
            <Link
              to="/acknowledgement"
              className="font-medium text-[#C89B3C] underline-offset-2 hover:underline"
            >
              Create your account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
