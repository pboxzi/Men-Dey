import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';

function BrandGate() {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="flex size-20 items-center justify-center border border-gold/60 text-4xl text-charcoal"
        aria-hidden
      >
        <span style={{fontFamily: "'Playfair Display', Georgia, serif"}}>GA</span>
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.4em] text-charcoal">
        Gillian
      </p>
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-charcoal">
        Anderson
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.5em] text-gold-deep">Management</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div>
      <section className="mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
        <BrandGate />

        <div className="mt-12 text-center">
          <p className="eyebrow mb-4">A private gate</p>
          <h1 className="mx-auto max-w-2xl text-3xl md:text-5xl">
            Access is managed, personal and by application only.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            This is the private office of Gillian Anderson Management — a professional,
            exclusive channel where every introduction, request and membership conversation
            passes through the management team.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/sign-in" className="btn btn-primary">
            Sign in
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to="/acknowledgement" className="btn btn-secondary">
            Create account
          </Link>
        </div>

        <p className="mt-10 text-center text-[0.65rem] uppercase tracking-[0.3em] text-muted">
          Private · Managed · Exclusive · Personal · Professional
        </p>
      </section>

      <section className="border-t border-stone bg-white/60">
        <div className="mx-auto grid w-full max-w-4xl gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-3">01 · Acknowledge</p>
            <h2 className="mb-2 text-xl">Read before you join</h2>
            <p className="text-sm leading-relaxed text-muted">
              Account creation begins with an explicit acknowledgement of the platform's
              purpose, privacy expectations and availability disclaimer. Nothing is accepted
              on your behalf.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">02 · Apply</p>
            <h2 className="mb-2 text-xl">Introduce yourself</h2>
            <p className="text-sm leading-relaxed text-muted">
              A short application tells management who you are and what you would like to
              explore. Membership is never purchased during account creation.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">03 · Reviewed by management</p>
            <h2 className="mb-2 text-xl">The bridge stays in place</h2>
            <p className="text-sm leading-relaxed text-muted">
              Management reviews every application and coordinates every next step —
              membership, requests and experiences are always proposed and confirmed
              individually.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
