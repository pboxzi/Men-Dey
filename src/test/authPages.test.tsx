import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
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

describe('sign in', () => {
  it('submits credentials and routes the user inside', async () => {
    mockCtl.signInWithPassword.mockResolvedValue({error: null});

    renderApp('/sign-in');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'tester@example.com');
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.click(screen.getByRole('button', {name: /sign in/i}));

    await waitFor(() =>
      expect(mockCtl.signInWithPassword).toHaveBeenCalledWith({
        email: 'tester@example.com',
        password: 'supersecret1',
      }),
    );
  });

  it('shows a friendly message for bad credentials', async () => {
    mockCtl.signInWithPassword.mockRejectedValue(new Error('Invalid login credentials'));

    renderApp('/sign-in');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email'), 'tester@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', {name: /sign in/i}));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email or password is incorrect.',
    );
  });
});

describe('create account', () => {
  it('signs up with the stored acknowledgement metadata', async () => {
    mockCtl.signUp.mockResolvedValue({data: {session: null}, error: null});
    window.localStorage.setItem(
      'gam-acknowledgement',
      JSON.stringify({version: 1, at: '2026-10-04T10:00:00.000Z'}),
    );

    renderApp('/create-account');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Full name'), 'Test Person');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.type(screen.getByLabelText('Confirm password'), 'supersecret1');
    await user.click(screen.getByRole('button', {name: /create account/i}));

    await waitFor(() => expect(mockCtl.signUp).toHaveBeenCalledTimes(1));
    const payload = mockCtl.signUp.mock.calls[0]?.[0] as {
      email: string;
      options: {data: Record<string, string>};
    };
    expect(payload.email).toBe('new@example.com');
    expect(payload.options.data.ack_version).toBe('1');
    expect(payload.options.data.ack_at).toBe('2026-10-04T10:00:00.000Z');
    expect(payload.options.data.full_name).toBe('Test Person');

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/verify-email'),
    );
  });

  it('surfaces acknowledgement errors from the server', async () => {
    mockCtl.signUp.mockRejectedValue(
      new Error('acknowledgement required before account creation'),
    );
    window.localStorage.setItem(
      'gam-acknowledgement',
      JSON.stringify({version: 1, at: '2026-10-04T10:00:00.000Z'}),
    );

    renderApp('/create-account');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Full name'), 'Test Person');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.type(screen.getByLabelText('Confirm password'), 'supersecret1');
    await user.click(screen.getByRole('button', {name: /create account/i}));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please read and accept the acknowledgement before creating an account.',
    );
  });
});
