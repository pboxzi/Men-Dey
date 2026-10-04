import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, useLocation} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../lib/supabase', async () => {
  const {buildSupabaseMock} = await import('./mockSupabase');
  return {supabase: buildSupabaseMock()};
});

import {AuthProvider} from '../auth/AuthContext';
import {AppRoutes} from '../routes';
import {makeProfile, makeSession, mockCtl, resetMockCtl} from './mockSupabase';

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

describe('route guards', () => {
  it('redirects unauthenticated users from protected routes to sign in', async () => {
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/sign-in'));
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
  });

  it('keeps authenticated users away from the sign-in page', async () => {
    mockCtl.session = makeSession('user-1');
    mockCtl.profile = makeProfile('user-1', 'user');

    renderApp('/sign-in');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
  });

  it('redirects regular users from the management console to forbidden', async () => {
    mockCtl.session = makeSession('user-1');
    mockCtl.profile = makeProfile('user-1', 'user');

    renderApp('/management');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/forbidden'));
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('allows management into the console', async () => {
    mockCtl.session = makeSession('user-2');
    mockCtl.profile = makeProfile('user-2', 'management');

    renderApp('/management');
    expect(await screen.findByText('Management home')).toBeInTheDocument();
  });

  it('blocks management from the admin-only audit log', async () => {
    mockCtl.session = makeSession('user-2');
    mockCtl.profile = makeProfile('user-2', 'management');

    renderApp('/management/audit');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/forbidden'));
  });

  it('allows administrators into the audit log', async () => {
    mockCtl.session = makeSession('user-3');
    mockCtl.profile = makeProfile('user-3', 'admin');

    renderApp('/management/audit');
    expect(await screen.findByRole('heading', {name: 'Audit log'})).toBeInTheDocument();
  });

  it('sends management accounts to the console after sign-in redirect', async () => {
    mockCtl.session = makeSession('user-2');
    mockCtl.profile = makeProfile('user-2', 'management');

    renderApp('/home');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/management'));
  });
});

describe('acknowledgement gate', () => {
  it('blocks account creation until the acknowledgement is accepted', async () => {
    renderApp('/create-account');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/acknowledgement'));
  });

  it('allows account creation once the acknowledgement is stored', async () => {
    window.localStorage.setItem(
      'gam-acknowledgement',
      JSON.stringify({version: 1, at: '2026-10-04T10:00:00.000Z'}),
    );

    renderApp('/create-account');
    expect(await screen.findByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText(/Acknowledged version 1/)).toBeInTheDocument();
  });
});

describe('acknowledgement page', () => {
  it('requires an explicit acceptance before continuing', async () => {
    mockCtl.ackVersion = {
      id: 'ack-1',
      version: 1,
      title: 'Platform Acknowledgement',
      content: 'You must read this before joining.',
      is_active: true,
      published_at: '2026-10-01T00:00:00Z',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    };

    renderApp('/acknowledgement');
    expect(await screen.findByText('Platform Acknowledgement')).toBeInTheDocument();

    const continueButton = screen.getByRole('button', {name: /continue to account creation/i});
    expect(continueButton).toBeDisabled();
  });
});
