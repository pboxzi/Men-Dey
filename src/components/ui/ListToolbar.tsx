import {Search} from 'lucide-react';
import type {ReactNode} from 'react';

export interface ToolbarFilter {
  value: string;
  onChange: (value: string) => void;
  options: Array<{value: string; label: string}>;
  /** Accessible name for the dropdown — it has no visible label. */
  label: string;
}

/**
 * One tidy control block for list pages: search, a single dropdown that opens
 * and selects (instead of a cluster of filter chips), the result count, and
 * any extra controls — nothing floating around the panel.
 *
 * Phone: search on its own line, then a control row of
 * [dropdown][extras][count right-aligned]. sm and up: one line.
 */
export function ListToolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search',
  filter,
  count,
  children,
  className = 'mb-4',
}: {
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filter?: ToolbarFilter;
  count?: ReactNode;
  children?: ReactNode;
  /** Wrapper margin; pass '' when the page's own rhythm already spaces it. */
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${className}`.trim()}
    >
      {onSearch ? (
        <label className="search-field block w-full min-w-0 sm:w-auto sm:flex-1">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            className="field-input"
            value={search ?? ''}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
      ) : null}

      {filter || children || count ? (
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          {filter ? (
            <select
              className="field-input w-auto min-w-0 grow sm:flex-none"
              aria-label={filter.label}
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          {children}
          {count ? (
            <span className="ml-auto shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted">
              {count}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
