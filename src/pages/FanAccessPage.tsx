import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Bell, UserCog, ShieldCheck } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { useAuth } from '../utils/AuthContext';
import Button from '../components/ui/Button';

const BENEFITS = [
  {
    icon: MessageSquare,
    title: 'Messages',
    body: 'Send a private message to Gillian’s management and read their replies in one place.',
  },
  {
    icon: FileText,
    title: 'Requests',
    body: 'Submit a personal request. Management reviews every one and responds where appropriate.',
  },
  {
    icon: Bell,
    title: 'Official updates',
    body: 'Receive announcements and updates published by the management office.',
  },
  {
    icon: UserCog,
    title: 'Your account',
    body: 'Manage your profile, security settings and how the management office contacts you.',
  },
];

export default function FanAccessPage() {
  useSeo({
    title: 'Fan Access',
    description:
      'A private place for Gillian’s fans — communicate with management, submit requests and receive official updates.',
    canonicalPath: '/fan-access',
  });

  const { user } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: '#14181B' }}>
        <img
          src="/assets/images/gillian_mentoring_warmth_1783349719383.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'center 25%', opacity: 0.6 }}
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(20,24,27,.75) 0%, rgba(20,24,27,.55) 45%, rgba(20,24,27,.92) 100%)' }}
        />
        <div
          className="ed-shell relative"
          style={{ paddingTop: 'clamp(5rem,13vw,8.5rem)', paddingBottom: 'clamp(4rem,10vw,7rem)' }}
        >
          <div className="max-w-2xl">
            <span className="t-meta" style={{ color: 'rgba(255,255,255,.6)' }}>
              Fan Access
            </span>
            <h1 className="t-display mt-3" style={{ color: '#fff' }}>
              A private place for Gillian’s fans.
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,.72)', maxWidth: '36rem' }}>
              Your own quiet space, connected to Gillian’s official management. Sign in to send
              messages, submit personal requests and receive updates from the management office.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/create-account" variant="light" size="lg">
                Create Fan Account
              </Button>
              <Button
                to="/sign-in"
                variant="secondary"
                size="lg"
                className="!border-white/35 !text-white hover:!bg-white/10"
              >
                Sign In
              </Button>
            </div>

            <p className="mt-6 text-[12px]" style={{ color: 'rgba(255,255,255,.5)' }}>
              {user
                ? 'You are already signed in — head to your fan area.'
                : 'No payment required to create an account.'}
            </p>
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="ed-section">
        <div className="ed-shell grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <span className="t-meta">What Fan Access is</span>
            <hr className="ed-rule-accent mt-4" />
          </div>
          <div className="space-y-5">
            <p className="t-h2">Your private connection to Gillian’s official management.</p>
            <p className="t-body" style={{ maxWidth: '42rem' }}>
              Fan Access is a private area for communicating with the management office. You can
              write to management, send a personal request and keep track of what has been sent and
              what has been answered.
            </p>
            <p className="t-body" style={{ maxWidth: '42rem' }}>
              Management reviews every message. If a request is something that can be taken further,
              management will arrange it directly with you.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="ed-section" style={{ background: 'var(--ed-bg-alt)' }}>
        <div className="ed-shell">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="t-h3 mt-4" style={{ fontSize: '1.15rem' }}>
                    {item.title}
                  </h2>
                  <p className="t-body-sm mt-2">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Honest expectation setting */}
      <section className="ed-section">
        <div className="ed-shell grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <span className="t-meta">How it works</span>
            <h2 className="t-h2">Fan → Management → Response</h2>
            <p className="t-body" style={{ maxWidth: '42rem' }}>
              Everything you send goes to <strong style={{ color: 'var(--ed-ink)' }}>Gillian’s management</strong>,
              not to Gillian personally. The management team reads what you send, decides whether a
              response or further arrangement is appropriate, and replies to you inside your fan
              area.
            </p>
            <div className="ed-card p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 t-accent" />
                <div>
                  <h3 className="t-h3" style={{ fontSize: '1.05rem' }}>
                    What we do not promise
                  </h3>
                  <p className="t-body-sm mt-2">
                    Fan Access is not a route to direct personal contact with Gillian, and no
                    account or payment can guarantee a meeting, call or appearance. Where something
                    can be arranged, management will raise it with you directly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="ed-card p-7">
            <h2 className="t-h3">Ready to begin?</h2>
            <p className="t-body-sm mt-3">
              Create your account in a couple of minutes, or sign in if you already have one.
            </p>
            <div className="mt-6 space-y-3">
              <Button to="/create-account" variant="primary" size="lg" fullWidth>
                Create Fan Account
              </Button>
              <Button to="/sign-in" variant="secondary" size="lg" fullWidth>
                Sign In
              </Button>
            </div>
            <p className="t-caption mt-5">
              Prefer to write once without an account?{' '}
              <Link to="/contact" className="underline t-accent">
                Contact management
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
