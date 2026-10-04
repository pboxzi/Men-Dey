import type {ReactNode} from 'react';

import type {ChipTone} from '../../lib/requests';

const TONE_CLASS: Record<ChipTone, string> = {
  neutral: 'bg-stone text-muted',
  info: 'bg-charcoal/5 text-charcoal',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  gold: 'bg-gold/15 text-gold-deep',
};

export function Chip({
  tone = 'neutral',
  children,
}: {
  tone?: ChipTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
