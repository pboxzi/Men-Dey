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
import {mockCtl, resetMockCtl} from './mockSupabase';

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
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/home'));
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

  it('does not show the acknowledgement on the sign-in page', async () => {
    renderApp('/sign-in');
    expect(await screen.findByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
    expect(screen.queryByText(/acknowledgement/i)).not.toBeInTheDocument();
  });
});

describe('email verification', () => {
  it('verifies a token_hash link and shows the account-created state', async () => {
    mockCtl.verifyOtp.mockResolvedValue({error: null});

    renderApp('/verify-email?token_hash=abc123&type=signup');

    expect(await screen.findByRole('heading', {name: 'Email verified'})).toBeInTheDocument();
    expect(mockCtl.verifyOtp).toHaveBeenCalledWith({type: 'signup', token_hash: 'abc123'});
    expect(screen.getByRole('link', {name: /continue to your home/i})).toBeInTheDocument();
  });

  it('surfaces expired links with a recovery path', async () => {
    mockCtl.verifyOtp.mockResolvedValue({error: new Error('token has expired')});

    renderApp('/verify-email?token_hash=expired&type=signup');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This verification link has expired or is invalid. Request a new one below.',
    );
    expect(screen.getByRole('button', {name: /resend verification email/i})).toBeInTheDocument();
  });

  it('resends the verification email', async () => {
    mockCtl.resend.mockResolvedValue({error: null});

    renderApp('/verify-email?email=applicant@example.com');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', {name: /resend verification email/i}));

    await waitFor(() => expect(mockCtl.resend).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/a new confirmation email has been sent/i)).toBeInTheDocument();
  });

  it('treats an active session as already verified', async () => {
    mockCtl.session = {
      access_token: 't',
      user: {id: 'u', email: 'x@example.com'},
    } as never;

    renderApp('/verify-email');
    expect(await screen.findByRole('heading', {name: 'Email verified'})).toBeInTheDocument();
  });
});
