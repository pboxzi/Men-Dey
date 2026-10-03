import React from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'dark'
  | 'light'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    to?: never;
    href?: never;
  };

type ButtonAsLink = CommonProps & {
  to: string;
  href?: never;
  state?: unknown;
  replace?: boolean;
  target?: string;
  rel?: string;
  'aria-label'?: string;
};

type ButtonAsAnchor = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    href: string;
    to?: never;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

function classes(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string {
  return [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    children,
    className,
    ...rest
  } = props as ButtonAsButton & ButtonAsLink & ButtonAsAnchor;

  const cls = classes(variant, size, fullWidth, className);

  if ('to' in rest && typeof rest.to === 'string') {
    const { to, state, replace, target, rel } = rest as unknown as ButtonAsLink;
    return (
      <Link to={to} state={state} replace={replace} target={target} rel={rel} className={cls}>
        {loading && <span className="spinner" aria-hidden="true" />}
        {children}
      </Link>
    );
  }

  if ('href' in rest && typeof rest.href === 'string') {
    const anchorRest = rest as unknown as ButtonAsAnchor & { children?: React.ReactNode };
    return (
      <a {...anchorRest} className={cls}>
        {loading && <span className="spinner" aria-hidden="true" />}
        {children}
      </a>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...buttonRest}
      type={buttonRest.type ?? 'button'}
      className={cls}
      disabled={buttonRest.disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
