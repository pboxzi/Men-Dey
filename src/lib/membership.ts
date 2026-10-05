import type {MembershipOfferStatus, MembershipStatus} from '../types';
import type {ChipTone} from './requests';

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  pending: 'Payment pending',
  verification: 'Awaiting verification',
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const MEMBERSHIP_STATUS_TONES: Record<MembershipStatus, ChipTone> = {
  pending: 'gold',
  verification: 'gold',
  active: 'success',
  paused: 'info',
  cancelled: 'neutral',
  expired: 'neutral',
};

export const OFFER_STATUS_LABELS: Record<MembershipOfferStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const OFFER_STATUS_TONES: Record<MembershipOfferStatus, ChipTone> = {
  draft: 'neutral',
  sent: 'info',
  viewed: 'info',
  accepted: 'success',
  declined: 'danger',
  expired: 'neutral',
  cancelled: 'neutral',
};

export const TIER_INTERVAL_LABELS: Record<'monthly' | 'annual' | 'one_time', string> = {
  monthly: 'per month',
  annual: 'per year',
  one_time: 'one-time',
};

export function formatPrice(cents: number | null | undefined, currency = 'GBP'): string {
  if (cents === null || cents === undefined) return '';
  try {
    return new Intl.NumberFormat('en-GB', {style: 'currency', currency}).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function offerIsExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function offerRespondable(status: MembershipOfferStatus, expiresAt: string | null): boolean {
  if (status !== 'sent' && status !== 'viewed') return false;
  return !offerIsExpired(expiresAt);
}
