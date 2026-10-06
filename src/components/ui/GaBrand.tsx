import { Link } from 'react-router-dom';

export interface GaBrandProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  ariaLabel?: string;
  className?: string;
  showText?: boolean;
}

export function GaBrand({
  variant = 'light',
  size = 'md',
  to = '/',
  ariaLabel = 'Gillian Anderson Management home',
  className = '',
}: GaBrandProps) {
  const isLight = variant === 'light';

  // Uses the exact high-res horizontal logo generated from user's master upload
  const logoSrc = isLight
    ? '/assets/images/ga_logo_horizontal_transparent.png'
    : '/assets/images/ga_logo_horizontal_dark.png';

  const sizeClass =
    size === 'sm'
      ? 'h-6 sm:h-7'
      : size === 'lg'
        ? 'h-10 sm:h-12'
        : 'h-8 sm:h-9';

  const content = (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Gillian Anderson Management"
        className={`${sizeClass} w-auto object-contain shrink-0`}
        loading="eager"
      />
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={ariaLabel}
        className="inline-flex items-center group transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
