import {describe, expect, it} from 'vitest';

import {isAckError, toFriendlyMessage} from '../lib/errors';

describe('error mapping', () => {
  it('maps known auth errors to friendly text', () => {
    expect(toFriendlyMessage(new Error('Invalid login credentials'))).toBe(
      'Email or password is incorrect.',
    );
    expect(toFriendlyMessage(new Error('User already registered'))).toBe(
      'An account with this email already exists. Try signing in instead.',
    );
    expect(toFriendlyMessage(new Error('Email not confirmed'))).toBe(
      'Please verify your email address before signing in.',
    );
  });

  it('maps acknowledgement errors', () => {
    const ackMessage = toFriendlyMessage(
      new Error('acknowledgement required before account creation'),
    );
    expect(ackMessage).toMatch(/acknowledgement/i);
    expect(isAckError(new Error('acknowledgement required before account creation'))).toBe(true);
    expect(isAckError(new Error('Invalid login credentials'))).toBe(false);
  });

  it('never renders an empty message', () => {
    expect(toFriendlyMessage(null)).toBe('Something went wrong. Please try again.');
    expect(toFriendlyMessage('')).toBe('Something went wrong. Please try again.');
  });

  it('passes through unmapped messages', () => {
    expect(toFriendlyMessage(new Error('only management can change request status'))).toBe(
      'only management can change request status',
    );
  });
});
