import type {ReactNode} from 'react';

import {ActionMenu} from '../management/ActionMenu';

/**
 * Shared management page header.
 *
 * Phone: 24px title, 14px supporting line, actions collapsed to
 * [Primary] [•••] below sm. Tablet and desktop keep the original scale.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-stone pb-4 sm:mb-8 sm:gap-4 sm:pb-6">
      <div className="max-w-2xl min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5 sm:mb-2">{eyebrow}</p> : null}
        <h1 className="break-words text-2xl sm:text-3xl md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 break-words text-sm leading-relaxed text-muted sm:mt-2 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <ActionMenu>{actions}</ActionMenu>
        </div>
      ) : null}
    </div>
  );
}
