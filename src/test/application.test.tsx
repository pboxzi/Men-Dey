import {render, screen, waitFor} from '@testing-library/react';
import userEvent, {type UserEvent} from '@testing-library/user-event';
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

function storeAck() {
  window.localStorage.setItem(
    'gam-acknowledgement',
    JSON.stringify({version: 1, at: '2026-10-04T10:00:00.000Z'}),
  );
}

async function expectStep(heading: string) {
  expect(await screen.findByRole('heading', {name: heading})).toBeInTheDocument();
}

async function fillPersonal(user: UserEvent) {
  await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Phone'), '+44 20 7946 0000');
  await user.type(screen.getByLabelText('Country'), 'United Kingdom');
  await user.type(screen.getByLabelText('City'), 'London');
  await user.selectOptions(screen.getByLabelText('Preferred contact method'), 'email');
}

async function walkToAccount(user: UserEvent) {
  await expectStep('Personal information');
  await fillPersonal(user);
  await user.click(screen.getByRole('button', {name: /continue/i}));

  await expectStep('About you');
  await user.type(screen.getByLabelText('Occupation'), 'Mathematician');
  await user.type(screen.getByLabelText('Reason for joining'), 'To discuss a professional collaboration.');
  await user.type(screen.getByLabelText('What brings you to the platform?'), 'A managed professional connection.');
  await user.type(
    screen.getByLabelText(/what type of experience or connection/i),
    'A virtual meeting conversation.',
  );
  await user.click(screen.getByRole('button', {name: /continue/i}));

  await expectStep('Contact preferences');
  await user.click(screen.getByRole('button', {name: /continue/i}));

  await expectStep('Experience interests');
  await user.click(screen.getByRole('checkbox', {name: /virtual meeting/i}));
  await user.click(screen.getByRole('button', {name: /continue/i}));

  await expectStep('Review');
  await user.click(screen.getByRole('button', {name: /continue/i}));

  await expectStep('Account creation');
}

beforeEach(() => {
  resetMockCtl();
  window.localStorage.clear();
});

describe('application wizard', () => {
  it('completes a full registration with application metadata', async () => {    storeAck();
    mockCtl.signUp.mockResolvedValue({data: {session: null}, error: null});

    renderApp('/create-account/personal');
    const user = userEvent.setup();

    await walkToAccount(user);
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.type(screen.getByLabelText('Confirm password'), 'supersecret1');
    await user.click(screen.getByRole('checkbox', {name: /accept the terms/i}));
    await user.click(screen.getByRole('button', {name: /create account/i}));

    await waitFor(() => expect(mockCtl.signUp).toHaveBeenCalledTimes(1));
    const payload = mockCtl.signUp.mock.calls[0]?.[0] as {
      email: string;
      password: string;
      options: {data: Record<string, unknown>};
    };

    expect(payload.email).toBe('ada@example.com');
    const data = payload.options.data;
    expect(data.full_name).toBe('Ada Lovelace');
    expect(data.phone).toBe('+44 20 7946 0000');
    expect(data.country).toBe('United Kingdom');
    expect(data.city).toBe('London');
    expect(data.occupation).toBe('Mathematician');
    expect(data.ack_version).toBe('1');
    expect(data.ack_at).toBe('2026-10-04T10:00:00.000Z');
    expect(data.experience_interests).toEqual(['virtual_meeting']);
    expect(data.contact_email_ok).toBe(true);

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/verify-email'),
    );
  });

  it('rejects an invalid email on step 1', async () => {
    storeAck();
    renderApp('/create-account/personal');
    const user = userEvent.setup();

    await expectStep('Personal information');
    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Phone'), '+44 20 7946 0000');
    await user.type(screen.getByLabelText('Country'), 'United Kingdom');
    await user.type(screen.getByLabelText('City'), 'London');
    await user.selectOptions(screen.getByLabelText('Preferred contact method'), 'email');
    await user.click(screen.getByRole('button', {name: /continue/i}));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/create-account/personal');
  });

  it('reports password mismatch at account creation', async () => {
    storeAck();
    renderApp('/create-account/personal');
    const user = userEvent.setup();

    await walkToAccount(user);
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.type(screen.getByLabelText('Confirm password'), 'differentpass1');
    await user.click(screen.getByRole('checkbox', {name: /accept the terms/i}));
    await user.click(screen.getByRole('button', {name: /create account/i}));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockCtl.signUp).not.toHaveBeenCalled();
  });

  it('keeps answers when navigating backwards from step 4 to step 3', async () => {
    storeAck();
    renderApp('/create-account/personal');
    const user = userEvent.setup();

    await expectStep('Personal information');
    await fillPersonal(user);
    await user.click(screen.getByRole('button', {name: /continue/i}));

    await expectStep('About you');
    await user.type(screen.getByLabelText('Occupation'), 'Mathematician');
    await user.type(screen.getByLabelText('Reason for joining'), 'To discuss a professional collaboration.');
    await user.type(screen.getByLabelText('What brings you to the platform?'), 'A managed professional connection.');
    await user.type(
      screen.getByLabelText(/what type of experience or connection/i),
      'A virtual meeting conversation.',
    );
    await user.click(screen.getByRole('button', {name: /continue/i}));

    await expectStep('Contact preferences');
    await user.click(screen.getByRole('button', {name: /continue/i}));

    await expectStep('Experience interests');
    await user.click(screen.getByRole('checkbox', {name: /meet & greet/i}));
    await user.click(screen.getByRole('button', {name: /back/i}));

    await expectStep('Contact preferences');
    expect(screen.getByLabelText('Email')).toBeChecked();
    await user.click(screen.getByRole('button', {name: /continue/i}));

    await expectStep('Experience interests');
    expect(screen.getByRole('checkbox', {name: /meet & greet/i})).toBeChecked();
    // typed values from earlier steps are still present in the review
    await user.click(screen.getByRole('button', {name: /continue/i}));
    await expectStep('Review');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Mathematician')).toBeInTheDocument();
  });

  it('restores the draft after a refresh mid-onboarding', async () => {
    storeAck();
    const first = renderApp('/create-account/personal');
    const user = userEvent.setup();

    await expectStep('Personal information');
    await fillPersonal(user);
    await user.click(screen.getByRole('button', {name: /continue/i}));
    await expectStep('About you');

    first.unmount();

    renderApp('/create-account/personal');
    expect(await screen.findByRole('heading', {name: 'Personal information'})).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('City')).toHaveValue('London');
  });

  it('shows a friendly message when the email already exists', async () => {
    storeAck();
    mockCtl.signUp.mockRejectedValue(new Error('User already registered'));

    renderApp('/create-account/personal');
    const user = userEvent.setup();

    await walkToAccount(user);
    await user.type(screen.getByLabelText('Password'), 'supersecret1');
    await user.type(screen.getByLabelText('Confirm password'), 'supersecret1');
    await user.click(screen.getByRole('checkbox', {name: /accept the terms/i}));
    await user.click(screen.getByRole('button', {name: /create account/i}));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Try signing in instead.',
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/create-account/account');
  });
});

describe('unverified account protection', () => {
  it('blocks restricted routes until the email is verified', async () => {
    mockCtl.session = makeSession('user-9');
    mockCtl.profile = {...makeProfile('user-9', 'user'), email_verified_at: null};

    renderApp('/dashboard');
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/verify-email'),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('tester%40example.com');
  });
});
