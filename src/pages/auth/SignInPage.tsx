import {Gem, Lock, Sparkles, Star, Users} from 'lucide-react';
import {useState, type FormEvent} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {GaBrand} from '../../components/ui/GaBrand';
import {toFriendlyMessage} from '../../lib/errors';

const VALUE_PROPS = [
  {icon: Star, title: 'Exclusive access', copy: 'Behind the scenes and beyond'},
  {icon: Users, title: 'Personal connection', copy: 'Be part of a select community'},
  {icon: Gem, title: 'Unique experiences', copy: 'Special moments, just for you'},
  {icon: Sparkles, title: 'Management support', copy: 'Dedicated to your journey'},
];

const inputClass =
  'w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-stone-400 focus:border-[#C89B3C] focus:outline-none focus:ring-1 focus:ring-[#C89B3C]/60';

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
    <div className="relative min-h-screen overflow-hidden bg-[#14120E] text-[#F5F1E8]">
      <img
        src="/assets/images/gillian_home_hero.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[70%_25%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0B07]/95 via-[#0D0B07]/70 to-[#0D0B07]/85" />
      <div className="absolute inset-0 bg-[#1A1206]/30 mix-blend-multiply" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top brand bar */}
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <GaBrand variant="light" size="md" to="/" />
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-300 md:block">
            A private space <span className="text-[#C89B3C]">·</span> Exclusive access{' '}
            <span className="text-[#C89B3C]">·</span> Real connections
          </p>
        </header>

        {/* Hero + auth card */}
        <main className="flex flex-1 items-center px-6 py-8 sm:px-10">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-stone-300">
                Welcome to the
              </p>
              <h1 className="font-serif text-4xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Gillian Anderson
                <br />
                Management
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-stone-300 sm:text-base">
                An exclusive private space for a select community of supporters, fans and
                collaborators.
              </p>
              <span className="block h-px w-16 bg-[#C89B3C]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                Real connections <span className="text-[#C89B3C]">·</span> Unique experiences{' '}
                <span className="text-[#C89B3C]">·</span> Together
              </p>
              <p className="font-serif text-2xl italic text-[#C89B3C]/90">Gillian Anderson</p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 p-7 shadow-2xl backdrop-blur-xl sm:p-9 lg:ml-auto">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.32em] text-[#C89B3C]">
                Welcome
              </p>
              <h2 className="mb-3 text-center font-serif text-2xl font-normal text-white sm:text-3xl">
                Your exclusive access awaits
              </h2>
              <p className="mb-7 text-center text-xs leading-relaxed text-stone-400 sm:text-sm">
                Sign in to your account or create a new one to continue your journey.
              </p>

              <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
                {error ? <Alert tone="error">{error}</Alert> : null}

                <Field
                  label="Email"
                  labelClassName="text-xs font-medium uppercase tracking-wider text-stone-300"
                >
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  )}
                </Field>

                <Field
                  label="Password"
                  labelClassName="text-xs font-medium uppercase tracking-wider text-stone-300"
                >
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  )}
                </Field>

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-stone-400 underline-offset-2 hover:text-[#C89B3C] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" loading={submitting}>
                  Sign In
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>

                <Link
                  to="/acknowledgement"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#C89B3C] hover:text-[#C89B3C]"
                >
                  Create Account <span aria-hidden="true">→</span>
                </Link>
              </form>

              <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-stone-500">
                <Lock className="h-3.5 w-3.5 text-[#C89B3C]" aria-hidden="true" />
                Your privacy and security are our priority.
              </p>
            </div>
          </div>
        </main>

        {/* Value props strip */}
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
            {VALUE_PROPS.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#C89B3C]" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-200">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
