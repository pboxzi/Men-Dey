import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import Button from './Button';

interface StateBlockProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function StateBlock({ icon, title, description, action, className }: StateBlockProps) {
  return (
    <div className={`state-block ${className ?? ''}`}>
      {icon && <div className="state-icon">{icon}</div>}
      <h3 className="t-h3">{title}</h3>
      {description && <p className="t-body-sm" style={{ maxWidth: '32rem' }}>{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="state-icon">
        <Loader2 className="h-5 w-5" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <p className="t-caption">{label}</p>
    </div>
  );
}

export function EmptyState(props: StateBlockProps) {
  return <StateBlock {...props} icon={props.icon ?? <Inbox className="h-5 w-5" />} />;
}

interface ErrorStateProps extends StateBlockProps {
  onRetry?: () => void;
}

export function ErrorState({ title, description, action, onRetry, icon, className }: ErrorStateProps) {
  return (
    <StateBlock
      className={className}
      icon={icon ?? <AlertTriangle className="h-5 w-5" />}
      title={title ?? 'Something went wrong'}
      description={description}
      action={
        action ??
        (onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null)
      }
    />
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className ?? ''}`} style={style} aria-hidden="true" />;
}
