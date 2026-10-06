import {
  ChevronRight,
  Crown,
  FileText,
  MessageSquare,
  Sparkles,
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
          1. FULL-WIDTH HERO BANNER (Edge-to-edge, compact, seamless blend)
      ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-[#FAF8F5] border-b border-[#EAE4DA]">
        <div className="mx-auto w-full max-w-7xl min-h-[250px] sm:min-h-[280px] lg:min-h-[310px] relative flex items-center">
          {/* Background Right: Seamless Gillian Hero Portrait */}
          <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[65%] pointer-events-none select-none overflow-hidden flex justify-end">
            <div className="relative h-full w-full">
              <img
                src="/assets/images/gillian_hero_seamless.jpg"
                alt="Gillian Anderson Management"
                className="h-full w-full object-cover object-[right_center] lg:object-[center_center]"
                loading="eager"
              />
              {/* Soft horizontal gradient mask to ensure 100% invisible blend on the left */}
              <div className="absolute inset-y-0 left-0 w-32 sm:w-48 bg-gradient-to-r from-[#FAF8F5] to-transparent" />
              {/* Mobile bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#FAF8F5] to-transparent lg:hidden" />
            </div>
          </div>

          {/* Mobile scrim so the words stay crisp over the photo */}
          <div className="absolute inset-0 bg-[#FAF8F5]/72 sm:hidden" aria-hidden="true" />

          {/* Left Hero Content */}
          <div className="relative z-10 w-full lg:w-[50%] px-6 sm:px-10 py-6 sm:py-7 lg:py-8 space-y-3.5">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8C8275]">
                WELCOME TO YOUR PRIVATE SPACE.
              </span>
              <span className="w-8 h-[1px] bg-[#C89B3C]/70" />
            </div>

            <h1 className="font-serif text-[27px] sm:text-3xl lg:text-[38px] text-[#1E1E1E] leading-[1.14] tracking-tight font-normal">
              Gillian Anderson
              <br />
              Management
            </h1>

            <p className="text-xs sm:text-[13px] text-[#6E6A63] leading-relaxed max-w-md">
              A place to connect with management, explore your options and follow the experiences
              being arranged for you.
            </p>

            {/* 2 Action Pill Buttons (MY MEMBERSHIP removed per instruction) */}
            <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
              <Link
                to="/dashboard/messages"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E1E1E] hover:bg-black text-white text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[2]" />
                <span>TALK TO MANAGEMENT</span>
                <ChevronRight className="w-3 h-3 ml-0.5 opacity-70" />
              </Link>

              <Link
                to="/dashboard/requests"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#1E1E1E] border border-[#EAE4DA] hover:border-[#C89B3C] text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] transition-all shadow-xs backdrop-blur-xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#8C8275]" />
                <span>MY REQUESTS</span>
                <ChevronRight className="w-3 h-3 ml-0.5 text-[#8C8275]" />
              </Link>
            </div>
          </div>

          {/* Floating Quote on the far right (matches reference image) */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {JOURNEY.map((item) => (
              <div key={item.step} className="relative flex flex-col items-center sm:items-start text-center sm:text-left">
                {/* Number Circle Badge */}
                <div className="w-10 h-10 rounded-full border border-[#D9D1C3] bg-[#FAF8F5] text-[#8C8275] font-serif text-xs font-semibold flex items-center justify-center mb-4">
                  {item.step}
                </div>

                <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#1E1E1E] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6E6A63] leading-relaxed max-w-xs">
                  {item.description}
                </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: TALK TO MANAGEMENT */}
            <div className="bg-white rounded-xl border border-[#EAE4DA] overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/60 transition-colors group">
              <div>
                <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                  <img
                    src="/assets/images/feature_talk_management.jpg"
                    alt="Talk to Management desk"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#1E1E1E] shadow-xs">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                    TALK TO MANAGEMENT
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-2 leading-relaxed">
                    Start a private conversation with the management team.
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to="/dashboard/messages"
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
                >
                  <span>OPEN MESSAGES</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Card 2: REQUEST SOMETHING PERSONAL */}
            <div className="bg-white rounded-xl border border-[#EAE4DA] overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/60 transition-colors group">
              <div>
                <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                  <img
                    src="/assets/images/feature_request_personal.jpg"
                    alt="Request stationery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#1E1E1E] shadow-xs">
                    <FileText className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                    REQUEST SOMETHING PERSONAL
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-2 leading-relaxed">
                    Tell management what you would like to explore and we'll guide you through
                    the appropriate process.
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to="/dashboard/requests/new"
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
                >
                  <span>MAKE A REQUEST</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Card 3: EXPLORE MEMBERSHIP */}
            <div className="bg-white rounded-xl border border-[#EAE4DA] overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/60 transition-colors group">
              <div>
                <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                  <img
                    src="/assets/images/feature_explore_membership.jpg"
                    alt="Membership card"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#C89B3C] shadow-xs">
                    <Crown className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E1E]">
                    EXPLORE MEMBERSHIP
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-2 leading-relaxed">
                    Learn how membership works and discuss your options with management.
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to="/dashboard/membership"
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
                >
                  <span>VIEW MEMBERSHIP</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Card 4: FROM MANAGEMENT */}
            <div className="bg-white rounded-xl border border-[#EAE4DA] p-5 shadow-xs flex flex-col justify-between hover:border-[#C89B3C]/60 transition-colors">
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
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#A67F2C] hover:text-[#C89B3C] inline-flex items-center gap-1 transition-colors"
                >
                  <span>VIEW MESSAGES</span>
                  <span>→</span>
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
              className="text-[#C89B3C] hover:text-[#E0B85C] transition-colors inline-flex items-center gap-1"
            >
              <span>Talk to Management</span>
              <span>→</span>
            </Link>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <Link
              to="/dashboard/membership"
              className="text-stone-300 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Explore Membership</span>
              <span>→</span>
            </Link>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <Link
              to="/dashboard/requests/new"
              className="text-stone-300 hover:text-white transition-colors inline-flex items-center gap-1"
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
