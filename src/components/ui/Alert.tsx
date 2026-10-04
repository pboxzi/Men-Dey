import {CircleAlert, CircleCheck} from 'lucide-react';
import type {ReactNode} from 'react';

type Tone = 'error' | 'success' | 'info';

const TONE: Record<Tone, {wrap: string; icon: ReactNode}> = {
  error: {
    wrap: 'border-danger/30 bg-danger/5 text-danger',
    icon: <CircleAlert className="size-4 shrink-0" aria-hidden />,
  },
  success: {
    wrap: 'border-success/30 bg-success/5 text-success',
    icon: <CircleCheck className="size-4 shrink-0" aria-hidden />,
  },
  info: {
    wrap: 'border-stone-deep bg-stone/60 text-ink',
    icon: null,
  },
};

export function Alert({tone = 'info', children}: {tone?: Tone; children: ReactNode}) {
  const style = TONE[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-sm border px-3.5 py-2.5 text-sm ${style.wrap}`}
    >
      {style.icon}
      <div className="leading-snug">{children}</div>
    </div>
  );
}
