import {useEffect, useState, type ReactNode} from 'react';

import {ArrowLeft, ArrowRight} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {Link, useLocation} from 'react-router-dom';

import {GateHeader} from '../../../components/auth/GateHeader';
import {LEGAL_CONTACT, LEGAL_NAV, LEGAL_UPDATED, type TocItem} from './legalNav';

/**
 * Shared reading surface for the four public documents (legal notice, privacy,
 * terms, policies). They live on the same cinematic portrait as the gate, so
 * the copy sits in the flat `gate-doc` band — a hairline of gold on the left,
 * no card, no shadow — with a sticky table of contents beside it.
 *
 * The table of contents highlights the section currently being read; the
 * arrays passed in come from module scope in each page, so the observer only
 * ever binds once per document.
 */

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export function LegalShell({
  eyebrow,
  title,
  lede,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  toc: TocItem[];
  children: ReactNode;
}) {
  const reduce = useReducedMotion() === true;
  const location = useLocation();
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    const sections = toc
      .map(({id}) => document.getElementById(id))
      .filter((el): el is HTMLElement => el instanceof HTMLElement);
    if (sections.length === 0) return;

    // Read-ahead: a section becomes "current" once it passes the top quarter of
    // the viewport, which keeps the rail in step with what the eye is on.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {rootMargin: '-12% 0px -64% 0px', threshold: 0},
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [toc]);

  const related = LEGAL_NAV.filter((item) => item.to !== location.pathname);

  const tocLinks = (className: string) => (
    <ul className={className}>
      {toc.map((item, index) => {
        const isActive = active === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={`flex min-h-9 items-start gap-3 border-l-2 py-1.5 pl-3 text-[12.5px] leading-snug transition-colors ${
                isActive
                  ? 'border-[#C89B3C] text-[#FCFAF7]'
                  : 'border-transparent text-[#E6E0D6]/62 hover:border-[#C89B3C]/50 hover:text-[#EAE4DA]'
              }`}
            >
              <span className="w-4 shrink-0 pt-px text-[10px] font-semibold tracking-[0.14em] text-[#C89B3C]/80 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  const rise = {
    initial: reduce ? {opacity: 1, y: 0} : {opacity: 0, y: 16},
    animate: {opacity: 1, y: 0},
    transition: {duration: reduce ? 0 : 0.6, ease: EASE},
  };

  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-16 pt-8 sm:px-10 sm:pb-20 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />

      <motion.header {...rise} className="mx-auto mt-9 w-full max-w-[70rem] sm:mt-12">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="h-px w-10 shrink-0 bg-[#C89B3C]/85 sm:w-14" aria-hidden />
          <p className="text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.34em] text-[#C89B3C] sm:text-[0.66rem] sm:tracking-[0.4em]">
            {eyebrow}
          </p>
        </div>

        <h1 className="mt-5 font-display text-[clamp(1.85rem,5.4vw,3rem)] font-normal leading-[1.16] text-[#FCFAF7]">
          {title}
        </h1>

        <div className="mt-6 max-w-[46rem] text-[0.9375rem] leading-[1.95] text-[#E6E0D6]">
          {lede}
        </div>

        <p className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.5625rem] font-semibold uppercase tracking-[0.28em] text-[#E6E0D6]/60 sm:text-[0.625rem] sm:tracking-[0.32em]">
          <span>Last updated {LEGAL_UPDATED}</span>
          <span aria-hidden className="text-[#C89B3C]">
            &middot;
          </span>
          <span>
            Questions:{' '}
            <a
              href={`mailto:${LEGAL_CONTACT}`}
              className="text-[#EAE4DA] underline decoration-[#C89B3C]/60 underline-offset-4 transition-colors hover:text-[#C89B3C]"
            >
              {LEGAL_CONTACT}
            </a>
          </span>
        </p>
      </motion.header>

      <div className="mx-auto mt-10 grid w-full max-w-[70rem] gap-7 lg:mt-14 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:max-h-[calc(100svh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          {/* Narrow screens: the rail folds into a disclosure so the document
              itself stays the first thing on the page. */}
          <details className="group border-l-2 border-[#C89B3C]/60 bg-[#0C0B0A]/55 px-4 py-3 lg:hidden">
            <summary className="cursor-pointer list-none text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-[#C89B3C] [&::-webkit-details-marker]:hidden">
              On this page
            </summary>
            <div className="mt-3 border-t border-[#EAE4DA]/12 pt-2">{tocLinks('space-y-0.5')}</div>
          </details>

          <nav aria-label="On this page" className="hidden lg:block">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-[#8F887E]">
              On this page
            </p>
            <div className="mt-4 border-t border-[#EAE4DA]/12 pt-3">{tocLinks('space-y-0.5')}</div>
          </nav>
        </aside>

        <article
          id="document-top"
          className="gate-doc min-w-0 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11"
        >
          {children}

          <p className="mt-12 border-t border-[#EAE4DA]/12 pt-6 text-[12.5px] leading-relaxed text-[#E6E0D6]/65">
            This document was last updated on {LEGAL_UPDATED}. Earlier versions are available on
            request from {LEGAL_CONTACT}. Reading it takes a few minutes; living by it takes no
            effort at all — thank you for doing both.
          </p>
        </article>
      </div>

      <section
        aria-label="Related legal documents"
        className="mx-auto mt-12 w-full max-w-[70rem] sm:mt-16"
      >
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-[#8F887E]">
          The rest of the legal desk
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex min-h-[7.5rem] flex-col justify-between border border-[#EAE4DA]/18 bg-[#0C0B0A]/55 px-5 py-5 transition-colors hover:border-[#C89B3C]/70"
            >
              <span className="font-display text-[1.05rem] text-[#FCFAF7] transition-colors group-hover:text-[#C89B3C]">
                {item.label}
              </span>
              <span className="mt-2 text-[12.5px] leading-relaxed text-[#E6E0D6]/68">
                {item.note}
              </span>
              <span className="mt-4 inline-flex items-center gap-2 text-[0.5625rem] font-semibold uppercase tracking-[0.28em] text-[#C89B3C]">
                Read
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link to="/" className="gate-back">
            <ArrowLeft className="size-4" aria-hidden />
            Back to the welcome page
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Document primitives. Every page is built from these so the four documents
   share one rhythm: numbered serif headings, a gold rule, then prose.
   --------------------------------------------------------------------------- */

export interface DocSectionSpec {
  id: string;
  title: string;
}

export function DocSection({
  spec,
  n,
  children,
}: {
  spec: DocSectionSpec;
  n: number;
  children: ReactNode;
}) {
  return (
    <section id={spec.id} className="mt-10 scroll-mt-24 first:mt-0">
      <h2 className="flex items-baseline gap-3 font-display text-[1.25rem] font-medium leading-snug text-[#FCFAF7] sm:text-[1.45rem]">
        <span className="shrink-0 text-[0.7rem] font-semibold tracking-[0.18em] text-[#C89B3C] tabular-nums">
          {String(n).padStart(2, '0')}
        </span>
        <span>{spec.title}</span>
      </h2>
      <div className="mt-3 h-px w-full bg-[#C89B3C]/35" aria-hidden />
      <div className="mt-4 space-y-4 text-[0.90625rem] leading-[1.95] text-[#E6E0D6]">
        {children}
      </div>
    </section>
  );
}

export function DocSub({children}: {children: ReactNode}) {
  return (
    <h3 className="!font-display text-[1.02rem] font-medium leading-snug text-[#EAE4DA]">
      {children}
    </h3>
  );
}

export function DocList({children}: {children: ReactNode}) {
  return (
    <ul className="mt-3 list-disc space-y-2.5 pl-5 marker:text-[#C89B3C]">{children}</ul>
  );
}

export function DocOrderedList({children}: {children: ReactNode}) {
  return (
    <ol className="mt-3 list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-[#C89B3C]">
      {children}
    </ol>
  );
}

export function DocNote({label, children}: {label: string; children: ReactNode}) {
  return (
    <aside className="border-l-2 border-[#C89B3C]/75 bg-[#0C0B0A]/55 px-4 py-4 sm:px-5">
      <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.3em] text-[#C89B3C]">
        {label}
      </p>
      <div className="mt-2.5 space-y-3 text-[0.875rem] leading-[1.9] text-[#EAE4DA]">
        {children}
      </div>
    </aside>
  );
}

/** Two-column fact list — used for retention periods, contact points, rights. */
export function DocFacts({rows}: {rows: ReadonlyArray<readonly [string, ReactNode]>}) {
  return (
    <dl className="mt-4 divide-y divide-[#EAE4DA]/12 border-y border-[#EAE4DA]/12">
      {rows.map(([term, detail]) => (
        <div key={term} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5">
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#C89B3C]">
            {term}
          </dt>
          <dd className="text-[0.875rem] leading-[1.85] text-[#E6E0D6]">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DocTable({
  head,
  rows,
}: {
  head: readonly string[];
  rows: ReadonlyArray<readonly ReactNode[]>;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left align-top">
        <thead>
          <tr className="border-b border-[#C89B3C]/45">
            {head.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-1 pb-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[#C89B3C]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAE4DA]/12">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-1 py-3 text-[0.8125rem] leading-[1.8] text-[#E6E0D6] first:text-[#EAE4DA] first:font-medium"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
