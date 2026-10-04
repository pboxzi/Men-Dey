import {ArrowRight, CalendarHeart, MessageSquare, Sparkles} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Spinner} from '../../components/ui/Spinner';
import {supabase} from '../../lib/supabase';
import type {SiteSetting} from '../../types';

const ACTIONS = [
  {
    to: '/dashboard/messages',
    label: 'Talk to management',
    description: 'Open your private conversation with the management office.',
    icon: MessageSquare,
  },
  {
    to: '/dashboard/requests/new',
    label: 'Request something personal',
    description: 'Tell management what you would like to explore. Every request is reviewed by hand.',
    icon: CalendarHeart,
  },
  {
    to: '/dashboard/membership',
    label: 'Explore membership',
    description: 'Understand how membership works. Nothing is ever purchased automatically.',
    icon: Sparkles,
  },
];

const JOURNEY = [
  {step: '01', title: 'Connect', description: 'You join the platform and management receives your application.'},
  {step: '02', title: 'Discuss', description: 'You write to management and share what matters to you.'},
  {step: '03', title: 'Arrange', description: 'Management reviews, asks what is needed and prepares a proposal.'},
  {step: '04', title: 'Experience', description: 'Approved experiences are scheduled and arranged for you.'},
];

interface FromManagement {
  title: string | null;
  message: string | null;
}

export function HomePage() {
  const {loading, profileLoading, role, profile} = useAuth();
  const [fromManagement, setFromManagement] = useState<FromManagement | null>(null);
  const [noteLoading, setNoteLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const {data} = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'home_from_management')
          .eq('is_public', true)
          .maybeSingle();
        if (!active) return;
        if (data) {
          const value = (data as SiteSetting).value ?? {};
          setFromManagement({
            title: typeof value.title === 'string' ? value.title : null,
            message: typeof value.message === 'string' ? value.message : null,
          });
        } else {
          setFromManagement(null);
        }
      } catch {
        if (active) setFromManagement(null);
      } finally {
        if (active) setNoteLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (role === 'management' || role === 'admin') return <Navigate to="/management" replace />;

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div>
      {/* Hero — one editorial image, nothing media-heavy */}
      <section className="border-b border-stone bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div>
            <p className="eyebrow mb-4">Private · Managed · Personal</p>
            <h1 className="text-4xl leading-tight md:text-5xl">
              Welcome to your private space{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              A place to connect with management, explore your options and follow the experiences
              being arranged for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard/messages" className="btn btn-primary">
                Talk to management
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                Go to dashboard
              </Link>
            </div>
          </div>
          <figure className="relative overflow-hidden rounded-sm border border-stone bg-stone">
            <img
              src="/assets/images/gillian_studio_portrait_1783349751129.jpg"
              alt="Editorial portrait from the Gillian Anderson Management archive"
              className="aspect-[4/5] w-full object-cover"
              loading="eager"
            />
            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/80 to-transparent p-4 text-xs uppercase tracking-[0.2em] text-alabaster">
              Gillian Anderson Management
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        {/* Three primary actions */}
        <section aria-labelledby="home-actions" className="mb-16">
          <p className="eyebrow mb-2">Where would you like to begin</p>
          <h2 id="home-actions" className="mb-6 text-2xl md:text-3xl">
            Your next step
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.to} to={action.to} className="surface group block p-6 transition-colors hover:border-gold">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-stone text-gold-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal">
                    {action.label}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <p className="text-sm leading-relaxed text-muted">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Your Journey */}
        <section aria-labelledby="home-journey" className="mb-16">
          <p className="eyebrow mb-2">Your Journey</p>
          <h2 id="home-journey" className="mb-6 text-2xl md:text-3xl">
            How things move forward
          </h2>
          <ol className="grid gap-4 md:grid-cols-4">
            {JOURNEY.map((item) => (
              <li key={item.step} className="surface p-5">
                <span className="text-3xl font-medium text-gold">{item.step}</span>
                <h3 className="mt-3 text-lg">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* From Management */}
        <section aria-labelledby="home-from-management">
          <p className="eyebrow mb-2">From Management</p>
          <h2 id="home-from-management" className="mb-6 text-2xl md:text-3xl">
            A message for you
          </h2>
          <div className="surface border-l-2 border-l-gold p-6 md:p-8">
            {noteLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted">
                <Spinner /> Loading message…
              </div>
            ) : fromManagement?.message ? (
              <>
                {fromManagement.title ? (
                  <h3 className="mb-3 text-xl">{fromManagement.title}</h3>
                ) : null}
                <p className="whitespace-pre-line leading-relaxed text-ink">{fromManagement.message}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Gillian Anderson Management
                </p>
              </>
            ) : (
              <>
                <p className="leading-relaxed text-muted">
                  Messages from management will appear here. When there is something to share with
                  you, it will arrive in this space and in your notifications.
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Gillian Anderson Management
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
