export interface GateBrandProps {
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * GA monogram in a thin gold square with the management wordmark.
 * Used on the cinematic private gate and every public authentication screen.
 */
export function GateBrand({size = 'md', className = ''}: GateBrandProps) {
  const compact = size === 'sm';

  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`.trim()}>
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center border border-[#C89B3C]/70 leading-none text-[#C89B3C] ${
          compact ? 'size-9 text-[0.9rem] sm:size-10 sm:text-base' : 'size-11 text-[1.05rem] sm:size-[3.25rem] sm:text-[1.2rem]'
        }`}
        style={{fontFamily: "'Playfair Display', Georgia, serif"}}
      >
        GA
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className={`truncate leading-none text-[#FCFAF7] ${
            compact ? 'text-[0.8rem] sm:text-[0.92rem]' : 'text-[0.9rem] sm:text-[1.1rem]'
          }`}
          style={{fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.14em'}}
        >
          GILLIAN ANDERSON
        </span>
        <span
          className={`mt-1.5 font-medium uppercase text-[#C89B3C] ${
            compact ? 'text-[0.5rem] tracking-[0.4em] sm:text-[0.55rem]' : 'text-[0.55rem] tracking-[0.44em] sm:text-[0.6rem]'
          }`}
        >
          Management
        </span>
      </span>
    </div>
  );
}
