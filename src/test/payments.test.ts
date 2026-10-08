import {describe, expect, it} from 'vitest';

import {
  DEFAULT_PAYMENT_SETTINGS,
  paymentMethodLabel,
  resolvePaymentDetails,
} from '../lib/payments';

describe('resolvePaymentDetails', () => {
  const accountDefault = {
    provider: 'paypal',
    label: 'PayPal account',
    instructions: 'Send to accounts@example.com.',
  };

  it('prefers the per-case values sent with the row', () => {
    const resolved = resolvePaymentDetails(
      {payment_provider: 'bank_transfer', payment_instructions: 'Transfer to GA, reference REQ1.'},
      accountDefault,
    );
    expect(resolved.provider).toBe('bank_transfer');
    expect(resolved.instructions).toBe('Transfer to GA, reference REQ1.');
    expect(paymentMethodLabel(resolved)).toBe('Bank transfer');
  });

  it('falls back to the account default for anything left blank', () => {
    const resolved = resolvePaymentDetails(
      {payment_provider: null, payment_instructions: ''},
      accountDefault,
    );
    expect(resolved.provider).toBe('paypal');
    expect(resolved.instructions).toBe('Send to accounts@example.com.');
  });

  it('uses the built-in defaults when there is no row and no settings', () => {
    expect(resolvePaymentDetails(null, null)).toEqual(DEFAULT_PAYMENT_SETTINGS);
  });
});
