import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

const PANEL_IMAGE = '/assets/images/gillian_studio_portrait_1783349751129.jpg';

export default function AuthLayout() {
  useSeo({ noindex: true });

  return (
    <div
      className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]"
      style={{ background: 'var(--ed-bg)' }}
    >
      {/* Editorial visual panel */}
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <img
          src={PANEL_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'center 20%' }}
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(20,24,27,.72) 0%, rgba(20,24,27,.45) 45%, rgba(20,24,27,.85) 100%)' }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 font-serif text-[12px] font-bold text-white">
              GA
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                Gillian Anderson
              </span>
              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.25em] text-[#C89B3C]">
                Management
              </span>
            </span>
          </Link>

          <div className="max-w-md">
            <span className="t-meta" style={{ color: 'rgba(255,255,255,.55)' }}>
              Private Fan Access
            </span>
            <p
              className="mt-4 font-elegant"
              style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.5rem)', lineHeight: 1.2, color: '#fff' }}
            >
              A private place for Gillian's fans.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,.65)' }}>
              Communicate with management, submit personal requests and receive official updates
              from your own fan area.
            </p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 pt-6 sm:px-10 lg:px-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[13px] transition-colors"
            style={{ color: 'var(--ed-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
          <Link to="/" className="lg:hidden" aria-label="Gillian Anderson Management — home">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ed-line-strong)] font-serif text-[11px] font-bold">
              GA
            </span>
          </Link>
        </div>

        <main
          id="main-content"
          className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14"
          tabIndex={-1}
        >
          <div className="w-full max-w-[26rem]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
