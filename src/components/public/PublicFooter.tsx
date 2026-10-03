import { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_GROUPS: Array<{ heading: string; links: Array<{ label: string; to: string }> }> = [
  {
    heading: 'Explore',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Appearances', to: '/appearances' },
      { label: 'Media', to: '/media' },
      { label: 'News', to: '/news' },
    ],
  },
  {
    heading: 'Connect',
    links: [
      { label: 'Fan Access', to: '/fan-access' },
      { label: 'Contact Management', to: '/contact' },
      { label: 'Sign In', to: '/sign-in' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

export default function PublicFooter() {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer style={{ background: '#14181B', color: 'rgba(255,255,255,.72)' }}>
      <div className="ed-shell" style={{ paddingTop: 'clamp(3rem,6vw,4.5rem)', paddingBottom: '2rem' }}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-3" aria-label="Gillian Anderson Management — home">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 font-serif text-[12px] font-bold text-white">
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
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>
              Official management presence for Gillian Anderson. All communication is handled
              through the management office with discretion.
            </p>
          </div>

          {NAV_GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="t-meta" style={{ color: 'rgba(255,255,255,.45)' }}>
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[13px] transition-colors hover:text-white"
                      style={{ color: 'rgba(255,255,255,.7)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="ed-rule my-10" style={{ background: 'rgba(255,255,255,.10)' }} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.45)' }}>
            © {year} Gillian Anderson Management. All rights reserved.
          </p>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.35)' }}>
            Communication is managed by Gillian's management team.
          </p>
        </div>
      </div>
    </footer>
  );
}
