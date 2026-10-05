import type {PaymentStatus} from '../types';

import {supabase} from './supabase';
import type {ChipTone} from './requests';

export interface PaymentSettings {
  provider: string;
  label: string | null;
  instructions: string | null;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  provider: 'manual',
  label: null,
  instructions: null,
};

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  manual: 'Managed payment',
  bank_transfer: 'Bank transfer',
  stripe: 'Card via Stripe',
  paypal: 'PayPal',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, ChipTone> = {
  pending: 'gold',
  processing: 'info',
  paid: 'success',
  failed: 'danger',
  refunded: 'info',
  cancelled: 'neutral',
};

export function paymentMethodLabel(settings: PaymentSettings): string {
  return PAYMENT_PROVIDER_LABELS[settings.provider] ?? settings.label ?? 'Managed payment';
}

export async function fetchPaymentSettings(): Promise<
  {settings: PaymentSettings; error: string | null}
> {
  const {data, error} = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'payment_settings')
    .maybeSingle();

  if (error) return {settings: DEFAULT_PAYMENT_SETTINGS, error: error.message};
  const value = (data?.value ?? {}) as Record<string, unknown>;
  return {
    settings: {
      provider: typeof value.provider === 'string' ? value.provider : 'manual',
      label: typeof value.label === 'string' ? value.label : null,
      instructions: typeof value.instructions === 'string' ? value.instructions : null,
    },
    error: null,
  };
}
