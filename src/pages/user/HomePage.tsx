import {
  ArrowDown,
  ChevronRight,
  Crown,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Spinner} from '../../components/ui/Spinner';
import {GaBrand} from '../../components/ui/GaBrand';
import {supabase} from '../../lib/supabase';
import type {SiteSetting} from '../../types';

const JOURNEY = [
  {
    step: '01',
    title: 'CONNECT',
    description: 'Create a relationship with management.',
  },
  {
    step: '02',
    title: 'DISCUSS',
    description: 'Tell management what you are looking for.',
  },
  {
    step: '03',
    title: 'ARRANGE',
    description: 'Management reviews availability and requirements.',
  },
  {
    step: '04',
    title: 'EXPERIENCE',
    description: 'Approved experiences are coordinated privately.',
  },
];

const FEATURES = [
  {
    image: '/assets/images/feature_talk_management.jpg',
    alt: 'Talk to Management desk',
    icon: <MessageSquare className="h-3.5 w-3.5 stroke-[1.8] text-[#1E1E1E]" />,
    title: 'TALK TO MANAGEMENT',
    description: 'Start a private conversation with the management team.',
    href: '/dashboard/messages',
    cta: 'OPEN MESSAGES',
  },
  {
    image: '/assets/images/feature_request_personal.jpg',
    alt: 'Request stationery',
    icon: <FileText className="h-3.5 w-3.5 stroke-[1.8] text-[#1E1E1E]" />,
    title: 'REQUEST SOMETHING PERSONAL',
    description:
      "Tell management what you would like to explore and we'll guide you through the appropriate process.",
    href: '/dashboard/requests/new',
    cta: 'MAKE A REQUEST',
  },
  {
    image: '/assets/images/feature_explore_membership.jpg',
    alt: 'Membership card',
    icon: <Crown className="h-3.5 w-3.5 stroke-[1.8] text-[#C89B3C]" />,
    title: 'EXPLORE MEMBERSHIP',
    description: 'Learn how membership works and discuss your options with management.',
    href: '/dashboard/membership',
    cta: 'VIEW MEMBERSHIP',
  },
];

interface FromManagement {
  title: string | null;
  message: string | null;
}

export function HomePage() {
  const {loading, profileLoading, role} = useAuth();
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

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1E1E1E]">
      {/* =========================================================================
          1. HERO — vertical editorial stack on phones, portrait composition on desktop
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-[#FAF8F5] border-b border-[#EAE4DA]">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col lg:min-h-[310px] lg:flex-row lg:items-center">
          {/* Portrait: static band on mobile, absolute right canvas on desktop */}
          <div className="relative h-[58vw] max-h-72 w-full shrink-0 overflow-hidden sm:max-h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:max-h-none lg:w-[65%]">
            <img
              src="/assets/images/gillian_hero_seamless.jpg"
              alt="Gillian Anderson Management"
              className="h-full w-full object-cover object-[68%_center] lg:object-[center_center]"
              loading="eager"
              decoding="async"
            />
            {/* Seamless left blend on desktop */}
            <div className="absolute inset-y-0 left-0 hidden w-48 bg-gradient-to-r from-[#FAF8F5] to-transparent lg:block" />
            {/* Soft fade into the page on mobile */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/60 to-transparent lg:hidden" />
          </div>

          {/* Content */}
          <div className="relative z-10 w-full space-y-4 px-6 py-7 sm:px-10 sm:py-8 lg:w-[50%] lg:py-8">
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C8275]">
                WELCOME TO YOUR PRIVATE SPACE.
              </span>
              <span className="w-8 h-[1px] bg-[#C89B3C]/70" />
            </div>

            <h1 className="font-serif text-[28px] leading-[1.14] tracking-tight font-normal text-[#1E1E1E] sm:text-3xl lg:text-[38px]">
              Gillian Anderson
              <br />
              Management
            </h1>

            <p className="max-w-md text-xs leading-relaxed text-[#6E6A63] sm:text-[13px]">
              A place to connect with management, explore your options and follow the experiences
              being arranged for you.
            </p>

            {/* Primary + secondary actions — stacked full width on phones */}
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/dashboard/messages"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1E1E1E] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-xs transition-all hover:bg-black sm:w-auto sm:py-2.5"
              >
                <MessageSquare className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                <span>TALK TO MANAGEMENT</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </Link>

              <Link
                to="/dashboard/requests"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#EAE4DA] bg-white/95 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1E1E1E] shadow-xs backdrop-blur-xs transition-all hover:border-[#C89B3C] hover:bg-white sm:w-auto sm:py-2.5"
              >
                <FileText className="h-4 w-4 text-[#8C8275]" aria-hidden="true" />
                <span>MY REQUESTS</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#8C8275]" aria-hidden="true" />
              </Link>

              <Link
                to="/dashboard/membership"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#C89B3C]/45 bg-transparent px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A67F2C] transition-all hover:border-[#C89B3C] hover:text-[#8C6519] sm:w-auto sm:py-2.5"
              >
                <Crown className="h-4 w-4" aria-hidden="true" />
                <span>MY MEMBERSHIP</span>
              </Link>
            </div>
          </div>

          {/* Floating Quote on the far right (desktop only) */}
          <div className="hidden lg:block absolute bottom-5 right-8 z-10 max-w-[240px] text-right pointer-events-none">
            <p className="font-serif italic text-[11px] text-stone-700 leading-relaxed drop-shadow-xs">
              “Meaningful connections create the most extraordinary opportunities.”
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#9A7326] mt-1.5">
              — GILLIAN ANDERSON
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. YOUR JOURNEY SECTION (Clean horizontal step progression)
      ========================================================================= */}
      <section className="py-10 sm:py-20 border-b border-[#EAE4DA] bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="mb-7 sm:mb-14">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C8275]">
                YOUR JOURNEY
              </span>
              <span className="w-6 h-[1px] bg-[#C89B3C]/70" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1E1E1E] tracking-tight">
              The right experience, at the right time.
            </h2>
          </div>

          {/* Mobile: vertical editorial timeline · Desktop: 4-step progression */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
            {JOURNEY.map((item, index) => (
              <div key={item.step} className="relative flex flex-col sm:block sm:text-left">
                <div className="flex gap-4 sm:block">
                  {/* Number badge */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D9D1C3] bg-[#FAF8F5] font-serif text-xs font-semibold text-[#8C8275]">
                    {item.step}
                  </span>

                  <div className="min-w-0 flex-1 sm:mt-4">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#1E1E1E] mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#6E6A63] leading-relaxed max-w-xs">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Mobile-only gold divider + downward flow into the next step */}
                {index < JOURNEY.length - 1 ? (
                  <div
                    className="mt-6 flex items-center gap-3 sm:hidden"
                    aria-hidden="true"
                  >
                    <span className="h-px flex-1 bg-gradient-to-r from-[#C89B3C]/55 to-[#C89B3C]/15" />
                    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#C89B3C]" />
                    <span className="h-px w-6 bg-[#C89B3C]/15" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURE CARDS GRID (3 image cards + 1 From Management card)
      ========================================================================= */}
      <section className="py-10 sm:py-20 border-b border-[#EAE4DA] bg-[#FAF8F5]">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-[#EAE4DA] bg-white shadow-xs transition-colors hover:border-[#C89B3C]/60"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-stone-100 sm:h-36 lg:h-32">
                    <img
                      src={feature.image}
                      alt={feature.alt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs">
                      {feature.icon}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#6E6A63]">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Link
                    to={feature.href}
                    className="after:absolute after:inset-0 after:content-[''] inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#C89B3C]/45 px-4 text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] transition-colors hover:border-[#C89B3C] hover:text-[#8C6519] sm:w-auto"
                  >
                    <span>{feature.cta}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            ))}

            {/* Card 4: FROM MANAGEMENT */}
            <div className="bg-white rounded-lg border border-[#EAE4DA] p-5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/60 transition-colors">
              <div>
                <div className="pb-3 border-b border-[#F5EFE6] mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C8275]">
                    FROM MANAGEMENT
                  </span>
                </div>

                {/* Avatar and sender */}
                <div className="flex items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#14171A] text-white flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src="/assets/images/ga-monogram-gold.png"
                        alt="GA"
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#1E1E1E]">
                      Gillian Anderson Management
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A89F91]">Today</span>
                </div>

                <p className="text-xs text-[#4A4742] leading-relaxed line-clamp-4 bg-[#FAF8F5] p-3 rounded-lg border border-[#F0ECE1] mt-2">
                  {fromManagement?.message ||
                    'Welcome to your private management space. If there is something you would like to explore, start by sending us a message.'}
                </p>
              </div>

              <div className="pt-4">
                <Link
                  to="/dashboard/messages"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#C89B3C]/45 px-4 text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] transition-colors hover:border-[#C89B3C] hover:text-[#8C6519]"
                >
                  <span>VIEW MESSAGES</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CLEAN SOLID DARK BANNER ("Where would you like to begin?")
             (No duplicate text texture, pure luxury obsidian)
      ========================================================================= */}
      <section className="bg-[#14171A] text-white py-10 sm:py-14 px-6 sm:px-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-100 font-light tracking-wide">
            Where would you like to begin?
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-1 text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
            <Link
              to="/dashboard/messages"
              className="inline-flex min-h-11 items-center gap-1 text-[#C89B3C] transition-colors hover:text-[#E0B85C]"
            >
              <span>Talk to Management</span>
              <span>→</span>
            </Link>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <Link
              to="/dashboard/membership"
              className="inline-flex min-h-11 items-center gap-1 text-stone-300 transition-colors hover:text-white"
            >
              <span>Explore Membership</span>
              <span>→</span>
            </Link>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <Link
              to="/dashboard/requests/new"
              className="inline-flex min-h-11 items-center gap-1 text-stone-300 transition-colors hover:text-white"
            >
              <span>Make a Request</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FOOTER (With official horizontal logo lockup)
      ========================================================================= */}
      <footer className="bg-[#FAF8F5] border-t border-[#EAE4DA] py-8 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <GaBrand variant="light" size="sm" to="/home" />

          <div className="text-[11px] text-[#8C8275] flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard/documents" className="hover:text-[#1E1E1E] transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link to="/dashboard/documents" className="hover:text-[#1E1E1E] transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link to="/dashboard/messages" className="hover:text-[#1E1E1E] transition-colors">
              Contact
            </Link>
            <span>·</span>
            <span>© Gillian Anderson Management</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
