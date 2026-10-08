import {type ReactNode} from 'react';

import {ArrowRight} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';

import {LEGAL_CONTACT, LEGAL_NAV, LEGAL_UPDATED, type TocItem} from './legalNav';

/**
 * Shared chrome for the four public documents (legal notice, privacy, terms,
 * policies). One reading column, top to bottom: a slim header with the four
 * document tabs, the title and summary, a quiet contents list, the document
 * itself, then a plain footer. No sidebar, no sticky rail, no scroll-spy —
 * these are pages people need to read straight through.
 */

const YEAR = new Date().getFullYear();

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
  const location = useLocation();
  const related = LEGAL_NAV.filter((item) => item.to !== location.pathname);

  return (
    <div className="min-h-[100svh] w-full bg-white text-[#3B3833]">
      <header className="sticky top-0 z-30 border-b border-[#EAE4DA] bg-white">
        <div className="mx-auto flex w-full max-w-[52rem] items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <Link
            to="/"
            aria-label="Gillian Anderson Management — home"
            className="flex shrink-0 items-center gap-3"
          >
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center border border-[#C89B3C]/70 font-display text-[0.85rem] leading-none text-[#A67F2C] sm:size-10 sm:text-[0.95rem]"
            >
              GA
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-display text-[0.8rem] tracking-[0.16em] text-[#1E1E1E] sm:text-[0.9rem]">
                GILLIAN ANDERSON
              </span>
              <span className="mt-1.5 text-[0.5rem] font-medium uppercase tracking-[0.4em] text-[#A67F2C]">
                Management
              </span>
            </span>
          </Link>

          <nav aria-label="Legal documents" className="flex items-center gap-1 sm:gap-2">
            {LEGAL_NAV.map((item) => {
              const current = item.to === location.pathname;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={current ? 'page' : undefined}
                  className={`inline-flex min-h-10 items-center border-b-2 px-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] transition-colors sm:px-2.5 sm:text-[0.6875rem] sm:tracking-[0.2em] ${
                    current
                      ? 'border-[#C89B3C] text-[#1E1E1E]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#1E1E1E]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[52rem] px-6 pb-20 pt-11 sm:px-8 sm:pt-16">
        <div className="flex items-center gap-4">
          <span className="h-px w-10 shrink-0 bg-[#C89B3C]" aria-hidden />
          <p className="text-[0.625rem] font-semibold uppercase leading-none tracking-[0.3em] text-[#8A6A1F]">
            {eyebrow}
          </p>
        </div>

        <h1 className="mt-5 font-display text-[clamp(1.85rem,5vw,2.7rem)] font-medium leading-[1.2] text-[#1E1E1E]">
          {title}
        </h1>

        <div className="legal-doc mt-6 text-[1rem] leading-[1.9] text-[#4A4640]">{lede}</div>

        <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-[#6E6A63]">
          <span>Last updated {LEGAL_UPDATED}</span>
          <span aria-hidden className="text-[#C89B3C]">
            &middot;
          </span>
          <span>
            Questions:{' '}
            <a
              href={`mailto:${LEGAL_CONTACT}`}
              className="text-[#8A6A1F] underline transition-colors hover:text-[#1E1E1E]"
            >
              {LEGAL_CONTACT}
            </a>
          </span>
        </p>

        <nav aria-label="Contents" className="mt-10">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.26em] text-[#6E6A63]">
            Contents
          </p>
          <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {toc.map((item, index) => (
              <li key={item.id} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                <span className="w-5 shrink-0 text-[#A67F2C] tabular-nums">{index + 1}.</span>
                <a
                  href={`#${item.id}`}
                  className="text-[#6E6A63] underline-offset-4 transition-colors hover:text-[#1E1E1E] hover:underline"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-doc mt-12 text-[0.9375rem] leading-[1.95] text-[#3B3833]">
          {children}

          <p className="mt-12 border-t border-[#EAE4DA] pt-6 text-[13px] leading-relaxed text-[#6E6A63]">
            This document was last updated on {LEGAL_UPDATED}. Earlier versions are available on
            request from {LEGAL_CONTACT}.
          </p>
        </article>

        <section aria-label="Related legal documents" className="mt-16">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.26em] text-[#6E6A63]">
            Continue reading
          </p>

          <ul className="mt-5 divide-y divide-[#EAE4DA] border-y border-[#EAE4DA]">
            {related.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex items-start gap-4 py-4 transition-colors hover:bg-[#FCFBF9]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-display text-[1.1rem] font-medium text-[#1E1E1E] transition-colors group-hover:text-[#8A6A1F]">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-[#6E6A63]">
                      {item.note}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1.5 size-4 shrink-0 text-[#A67F2C] transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-[#EAE4DA] bg-[#FAF8F4]">
        <div className="mx-auto flex w-full max-w-[52rem] flex-col gap-3 px-6 py-6 text-[12.5px] text-[#6E6A63] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>&copy; {YEAR} Gillian Anderson Management. All rights reserved.</span>
          <nav aria-label="Footer legal" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition-colors hover:text-[#1E1E1E]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Document primitives. Every page is built from these so the four documents
   share one rhythm: numbered serif headings, a hairline rule, then prose.
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
    <section id={spec.id} className="mt-12 scroll-mt-24 first:mt-0">
      <h2 className="flex items-baseline gap-3 font-display text-[1.3rem] font-medium leading-snug text-[#1E1E1E] sm:text-[1.45rem]">
        <span className="shrink-0 text-[0.7rem] font-semibold tracking-[0.16em] text-[#A67F2C] tabular-nums">
          {String(n).padStart(2, '0')}
        </span>
        <span>{spec.title}</span>
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function DocSub({children}: {children: ReactNode}) {
  return (
    <h3 className="!font-display text-[1.05rem] font-medium leading-snug text-[#1E1E1E]">
      {children}
    </h3>
  );
}

export function DocList({children}: {children: ReactNode}) {
  return <ul className="mt-3 list-disc space-y-2.5 pl-5 marker:text-[#C89B3C]">{children}</ul>;
}

export function DocOrderedList({children}: {children: ReactNode}) {
  return (
    <ol className="mt-3 list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-[#A67F2C]">
      {children}
    </ol>
  );
}

export function DocNote({label, children}: {label: string; children: ReactNode}) {
  return (
    <aside className="mt-5 border-l-2 border-[#C89B3C] bg-[#FAF8F4] px-5 py-4">
      <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.28em] text-[#8A6A1F]">
        {label}
      </p>
      <div className="mt-2.5 space-y-3 text-[0.875rem] leading-[1.9]">{children}</div>
    </aside>
  );
}

/** Two-column fact list — retention periods, contact points, rights. */
export function DocFacts({rows}: {rows: ReadonlyArray<readonly [string, ReactNode]>}) {
  return (
    <dl className="mt-4 divide-y divide-[#EFEAE1] border-y border-[#EFEAE1]">
      {rows.map(([term, detail]) => (
        <div key={term} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#8A6A1F]">
            {term}
          </dt>
          <dd className="text-[0.875rem] leading-[1.85]">{detail}</dd>
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
    <div className="mt-5 overflow-x-auto border border-[#EFEAE1]">
      <table className="w-full min-w-[34rem] border-collapse text-left align-top">
        <thead>
          <tr className="bg-[#FAF8F4]">
            {head.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-[#EFEAE1] px-4 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[#8A6A1F]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFEAE1]">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3.5 text-[0.8125rem] leading-[1.75] text-[#3B3833]"
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
