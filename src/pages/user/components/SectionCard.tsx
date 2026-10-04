import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: {to: string; label: string};
  children: ReactNode;
}) {
  return (
    <section className="surface flex flex-col p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-charcoal">{title}</h2>
        {action ? (
          <Link to={action.to} className="text-xs font-medium uppercase tracking-wider text-gold-deep hover:underline">
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function EmptyNote({title, description}: {title: string; description?: string}) {
  return (
    <div className="rounded-sm border border-dashed border-stone bg-stone/30 px-5 py-7 text-center">
      <p className="text-sm font-medium text-charcoal">{title}</p>
      {description ? <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
    </div>
  );
}

export function ErrorNote({message, onRetry}: {message: string; onRetry?: () => void}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn-ghost text-xs text-danger" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
