import type {ReactNode} from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface p-6 md:p-8 ${className}`.trim()}>{children}</div>;
}
