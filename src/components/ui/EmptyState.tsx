import {LayoutTemplate} from 'lucide-react';

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-stone text-muted">
        <LayoutTemplate className="size-5" aria-hidden />
      </span>
      <h2 className="text-xl">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
    </div>
  );
}
