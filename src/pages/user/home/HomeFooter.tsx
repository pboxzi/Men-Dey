import {Link} from 'react-router-dom';

import {LEGAL_LINKS} from '../../public/legal/legalNav';

export function HomeFooter() {
  return (
    <footer className="bg-[#111111] text-[#E8E1D7]">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p className="font-display text-[26px] font-medium leading-none tracking-[0.08em] text-[#C89B3C]">
              GA
            </p>
            <p className="mt-4 text-sm font-medium text-[#FCFAF7]">Gillian Anderson Management</p>
            <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#8F887E]">
              Private management and personal arrangements.
            </p>
          </div>

          <nav aria-label="Footer legal" className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8F887E]">
              Legal
            </p>
            <ul className="mt-4 space-y-1">
              {LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="inline-flex min-h-11 items-center text-[13px] text-[#E8E1D7] transition-colors hover:text-[#C89B3C]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8F887E]">
            PRIVATE · DISCREET · BY ARRANGEMENT
          </p>
        </div>
      </div>
    </footer>
  );
}
