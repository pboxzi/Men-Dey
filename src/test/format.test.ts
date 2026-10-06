import {describe, expect, it} from 'vitest';

import {relativeTime} from '../lib/format';

const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
const minutesAhead = (mins: number) => new Date(Date.now() + mins * 60_000).toISOString();

describe('relativeTime', () => {
  it('renders past timestamps as the past', () => {
    expect(relativeTime(minutesAgo(0.5))).toBe('just now');
    expect(relativeTime(minutesAgo(5))).toBe('5 minutes ago');
    expect(relativeTime(minutesAgo(120))).toBe('2 hours ago');
    expect(relativeTime(minutesAgo(24 * 60 + 60))).toBe('yesterday');
    expect(relativeTime(minutesAgo(3 * 24 * 60))).toBe('3 days ago');
  });

  it('renders future timestamps as the future', () => {
    expect(relativeTime(minutesAhead(10))).toBe('in 10 minutes');
    expect(relativeTime(minutesAhead(3 * 60))).toBe('in 3 hours');
    expect(relativeTime(minutesAhead(24 * 60 + 60))).toBe('tomorrow');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(relativeTime(null)).toBe('');
    expect(relativeTime(undefined)).toBe('');
    expect(relativeTime('not-a-date')).toBe('');
  });
});
