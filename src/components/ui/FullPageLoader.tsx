import {Spinner} from './Spinner';

export function FullPageLoader({label = 'Loading'}: {label?: string}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-alabaster">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/images/ga_logo_horizontal_transparent.png"
          alt="Gillian Anderson Management"
          className="h-10 w-auto object-contain sm:h-12"
          loading="eager"
        />
        <Spinner label={label} />
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      </div>
    </div>
  );
}
