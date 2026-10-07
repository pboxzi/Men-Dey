import {ArrowLeft} from 'lucide-react';
import {Link} from 'react-router-dom';

import {GateBrand} from './GateBrand';

/**
 * Shared chrome for every screen behind the gate: the GA wordmark anchored to
 * the portrait with an optional escape route back to the landing page.
 */
export function GateHeader({
  backTo = '/',
  backLabel = 'Back to the welcome page',
}: {
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <Link to="/" aria-label="Gillian Anderson Management home" className="inline-flex">
        <GateBrand />
      </Link>
      <Link to={backTo} className="gate-back">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
    </div>
  );
}
