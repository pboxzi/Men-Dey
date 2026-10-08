import {Link} from 'react-router-dom';

import {LEGAL_LINKS} from './legal/legalNav';

/**
 * The four documents at the foot of the welcome page, and nothing else — no
 * copyright line, no tagline, so the landing block keeps every pixel of height
 * it needs to stay inside the fold. Labels are shared with the legal desk, so
 * a footer link can never drift from the route it points at.
 */
export function LandingFooter() {
  return (
    <footer className="mt-6 border-t border-[#EAE4DA]/15 pt-3 sm:mt-7 sm:pt-4">
      <nav aria-label="Legal">
        <ul className="-ml-2 flex flex-wrap items-center">
          {LEGAL_LINKS.map((item, index) => (
            <li key={item.to} className="flex items-center">
              <Link
                to={item.to}
                className="inline-flex min-h-10 items-center px-2 text-[0.5625rem] font-semibold uppercase tracking-[0.28em] text-[#E6E0D6]/75 transition-colors hover:text-[#C89B3C] sm:text-[0.6rem] sm:tracking-[0.3em]"
              >
                {item.label}
              </Link>
              {index < LEGAL_LINKS.length - 1 ? (
                <span aria-hidden className="text-[#C89B3C]/60">
                  &middot;
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
