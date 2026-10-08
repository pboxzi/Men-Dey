import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../lib/supabase', async () => {
  const {buildSupabaseMock} = await import('./mockSupabase');
  return {supabase: buildSupabaseMock()};
});

import {AuthProvider} from '../auth/AuthContext';
import {AppRoutes} from '../routes';
import {resetMockCtl} from './mockSupabase';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <LocationDisplay />
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetMockCtl();
});

const DOCUMENTS: Array<[string, RegExp]> = [
  ['/legal', /legal notice, in plain language/i],
  ['/privacy', /your privacy, described properly/i],
  ['/terms', /the terms we both agree to/i],
  ['/policies', /how we keep this place considered/i],
];

describe('landing footer', () => {
  it('offers every legal document from the welcome page', async () => {
    renderApp('/');

    const nav = await screen.findByRole('navigation', {name: /^legal$/i});
    for (const [path, label] of [
      ['/legal', 'Legal'],
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
      ['/policies', 'Policies'],
    ] as const) {
      expect(within(nav).getByRole('link', {name: label})).toHaveAttribute('href', path);
    }
  });

  it('navigates to a document when a footer link is used', async () => {
    renderApp('/');
    const user = userEvent.setup();

    const nav = await screen.findByRole('navigation', {name: /^legal$/i});
    await user.click(within(nav).getByRole('link', {name: 'Privacy'}));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/privacy'));
  });
});

describe.each(DOCUMENTS)('%s', (path, heading) => {
  it('renders the document with its own table of contents', async () => {
    renderApp(path);

    expect(await screen.findByRole('heading', {level: 1, name: heading})).toBeInTheDocument();

    // Long-form body: numbered sections plus a contents list up top.
    expect(screen.getAllByRole('heading', {level: 2}).length).toBeGreaterThan(5);
    expect(screen.getByRole('navigation', {name: /^contents$/i})).toBeInTheDocument();

    // Every page carries the same contact and last-updated line.
    expect(screen.getAllByText(/last updated/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', {name: /admin@cmagency\.me/i}).length).toBeGreaterThan(0);
  });

  it('cross-links to the rest of the legal desk', async () => {
    renderApp(path);

    await screen.findByRole('heading', {level: 1, name: heading});

    const rail = screen.getByRole('region', {name: /related legal documents/i});
    const links = within(rail).getAllByRole('link');
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\/(legal|privacy|terms|policies)$/));
    }
    expect(links.some((link) => link.getAttribute('href') === path)).toBe(false);
  });
});
