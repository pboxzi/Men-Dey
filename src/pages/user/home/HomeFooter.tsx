import {Link} from 'react-router-dom';

import {LEGAL_LINKS} from '../../public/legal/legalNav';

export function HomeFooter() {
  return (
    <footer className="bg-[#111111] text-[#E8E1D7]">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <div className="min-w-0">
            <p className="font-display text-[26px] font-medium leading-none tracking-[0.08em] text-[#C89B3C]">
              GA
            </p>
            <p className="mt-4 text-sm font-medium text-[#FCFAF7]">Gillian Anderson Management</p>
            <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#8F887E]">
              Private management and personal arrangements.
            </p>
          </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <nav aria-label="Footer legal">
              <ul className="-ml-2 flex flex-wrap items-center">
                {LEGAL_LINKS.map((item, index) => (
                  <li key={item.to} className="flex items-center">
                    <Link
                      to={item.to}
                      className="inline-flex min-h-10 items-center px-2 text-[0.5625rem] font-semibold uppercase tracking-[0.28em] text-[#E8E1D7]/75 transition-colors hover:text-[#C89B3C] sm:text-[0.6rem] sm:tracking-[0.3em]"
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

            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.3em] text-[#8F887E] sm:text-[0.6rem] sm:tracking-[0.34em]">
              Private &middot; discreet &middot; by arrangement
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
