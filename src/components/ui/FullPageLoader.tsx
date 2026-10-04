import {Spinner} from './Spinner';

export function FullPageLoader({label = 'Loading'}: {label?: string}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-alabaster">
      <div className="flex flex-col items-center gap-3">
        <Spinner label={label} />
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      </div>
    </div>
  );
}
