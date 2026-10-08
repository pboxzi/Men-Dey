import {MoreHorizontal} from 'lucide-react';
import {Fragment, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';

/**
 * Flatten fragments and arrays so a page can keep handing PageHeader a single
 * `actions` node (a fragment of buttons, a lone button, conditional values).
 */
function flatten(node: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const walk = (child: ReactNode) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (Array.isArray(child)) {
      child.forEach(walk);
      return;
    }
    if (typeof child === 'object' && (child as {type?: unknown}).type === Fragment) {
      walk((child as {props: {children?: ReactNode}}).props.children);
      return;
    }
    out.push(child);
  };
  walk(node);
  return out;
}

/**
 * Mobile action group: every action inline from sm upward, and on phones the
 * primary action plus a `•••` menu holding the rest, so a page header never
 * stacks five full-width buttons down the screen.
 */
export function ActionMenu({children}: {children: ReactNode}) {
  const items = flatten(children);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;
  if (items.length === 1) return <>{items[0]}</>;

  return (
    <>
      <div className="hidden flex-wrap gap-2 sm:flex">{items}</div>

      <div ref={containerRef} className="relative flex items-center gap-2 sm:hidden">
        {items[0]}
        <button
          type="button"
          className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-sm border border-stone bg-white px-3 text-muted transition-colors hover:border-stone-deep hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More actions"
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 flex w-56 flex-col gap-1.5 border border-stone bg-white p-1.5 shadow-lg"
            onClick={() => setOpen(false)}
          >
            {items.slice(1).map((item, index) => (
              <div key={index} className="flex [&>*]:w-full">
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
