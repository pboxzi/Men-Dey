import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../utils/AuthContext';

beforeAll(() => {
  // Avoid touching the real network from supabase-js during route smoke tests.
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))));
});

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('route smoke tests', () => {
  it('renders the homepage', () => {
    renderRoute('/');
    expect(
      screen.getAllByText(/Gillian Anderson/i).length,
    ).toBeGreaterThan(0);
  });

  it('renders the about page', () => {
    const { container } = renderRoute('/about');
    expect(container.textContent?.length ?? 0).toBeGreaterThan(100);
  });

  it('renders the sign-in page', () => {
    renderRoute('/sign-in');
    expect(screen.getByText('Welcome back')).toBeTruthy();
  });

  it('renders the create-account page', () => {
    renderRoute('/create-account');
    expect(screen.getByText('Create your account')).toBeTruthy();
  });

  it('renders the contact page', () => {
    renderRoute('/contact');
    expect(screen.getAllByText(/contact/i).length).toBeGreaterThan(0);
  });

  it('renders the 404 page for unknown routes', () => {
    renderRoute('/definitely-not-a-page');
    expect(screen.getByText('This page does not exist')).toBeTruthy();
  });

  it('renders privacy and terms', () => {
    renderRoute('/privacy');
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    renderRoute('/terms');
    expect(screen.getByText('Terms of Use')).toBeTruthy();
  });

  it('redirects signed-out visitors away from the fan area', async () => {
    renderRoute('/fan');
    expect(await screen.findByText('Welcome back')).toBeTruthy();
  });

  it('redirects signed-out visitors away from the management office', async () => {
    renderRoute('/admin');
    expect(await screen.findByText('Welcome back')).toBeTruthy();
  });

  it('keeps legacy portal links working', async () => {
    renderRoute('/portal');
    expect(await screen.findByText('Welcome back')).toBeTruthy();
  });
});
