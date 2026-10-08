/**
 * One source of truth for the public legal surface: the routes, their short
 * notes (used by the "related documents" rail) and the shared metadata every
 * document quotes. Footers on the landing page and in the signed-in app read
 * from here so a link can never drift from the route it points at.
 */

export const LEGAL_UPDATED = '7 October 2026';

export const LEGAL_CONTACT = 'admin@cmagency.me';

export const LEGAL_SITE = 'https://www.cmagency.me';

export interface LegalNavItem {
  /** Nav label — also the footer label. */
  label: string;
  /** Route. */
  to: string;
  /** One-line description shown on the document-to-document rail. */
  note: string;
}

export const LEGAL_NAV: LegalNavItem[] = [
  {
    label: 'Legal',
    to: '/legal',
    note: 'Who runs this platform, how to reach us, and the index of every document below.',
  },
  {
    label: 'Privacy',
    to: '/privacy',
    note: 'What we collect, why we collect it, who can see it, how long we keep it and your rights.',
  },
  {
    label: 'Terms',
    to: '/terms',
    note: 'The agreement that governs your account, requests, membership and experiences.',
  },
  {
    label: 'Policies',
    to: '/policies',
    note: 'The house rules: conduct, content, billing, bookings, safety, accessibility and enforcement.',
  },
];

/** Footer-shaped subset: label + route only. */
export const LEGAL_LINKS: ReadonlyArray<Pick<LegalNavItem, 'label' | 'to'>> = LEGAL_NAV.map(
  ({label, to}) => ({label, to}),
);

/** Anchor target for a section, used by the table of contents. */
export interface TocItem {
  id: string;
  title: string;
}
