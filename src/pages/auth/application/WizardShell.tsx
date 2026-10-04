import {ArrowLeft, ArrowRight} from 'lucide-react';
import type {ReactNode} from 'react';
import {Link, useLocation} from 'react-router-dom';

import {Alert} from '../../../components/ui/Alert';
import {Button} from '../../../components/ui/Button';
import {Card} from '../../../components/ui/Card';
import {STEP_LABELS, STEP_PATHS, type StepPath} from './validation';

function stepIndex(step: StepPath): number {
  return STEP_PATHS.indexOf(step);
}

export function WizardShell({
  step,
  description,
  errors,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  loading = false,
  children,
}: {
  step: StepPath;
  description?: string;
  errors?: Record<string, string>;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  loading?: boolean;
  children: ReactNode;
}) {
  const location = useLocation();
  const index = stepIndex(step);
  const fromReview = (location.state as {fromReview?: boolean} | null)?.fromReview === true;
  const hasErrors = errors !== undefined && Object.keys(errors).length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <p className="eyebrow mb-3">
        Account application · Step {index + 1} of {STEP_PATHS.length}
      </p>
      <h1 className="mb-2 text-3xl md:text-4xl">{STEP_LABELS[step]}</h1>
      {description ? <p className="mb-8 text-sm text-muted">{description}</p> : null}

      <ol className="mb-8 flex gap-1.5" aria-label="Application progress">
        {STEP_PATHS.map((path, i) => (
          <li
            key={path}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= index ? 'bg-gold' : 'bg-stone'
            }`}
            aria-current={i === index ? 'step' : undefined}
          />
        ))}
      </ol>

      <Card>
        <div className="flex flex-col gap-5">
          {hasErrors ? (
            <Alert tone="error">
              Please correct the highlighted fields before continuing.
            </Alert>
          ) : null}
          {children}
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        {onBack ? (
          <Button variant="secondary" onClick={onBack} disabled={loading}>
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
        ) : (
          <Link to="/acknowledgement" className="btn btn-secondary">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        )}

        {onContinue ? (
          <Button onClick={onContinue} loading={loading}>
            {continueLabel}
            {continueLabel === 'Continue' ? <ArrowRight className="size-4" aria-hidden /> : null}
          </Button>
        ) : null}
      </div>

      {fromReview ? (
        <p className="mt-4 text-right text-xs text-muted">
          Returning to review after editing — your answers are saved.
        </p>
      ) : null}
    </div>
  );
}

export function fieldError(errors: Record<string, string> | undefined, key: string): string | undefined {
  return errors?.[key];
}
