import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';

export function LandingPage() {
  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <p className="eyebrow mb-4">Private platform</p>
        <h1 className="max-w-3xl text-4xl md:text-6xl">
          A direct, private line to Gillian Anderson Management.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Every message, request and membership conversation passes through the management
          office. Users and applicants never coordinate directly — the bridge is always here.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/acknowledgement" className="btn btn-primary">
            Create an account
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to="/sign-in" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      <section className="border-t border-stone bg-white/60">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-3">01 · Acknowledge</p>
            <h2 className="mb-2 text-xl">Read before you join</h2>
            <p className="text-sm leading-relaxed text-muted">
              Account creation starts with an explicit acknowledgement of the current
              published terms. Nothing is accepted on your behalf.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">02 · Apply</p>
            <h2 className="mb-2 text-xl">Membership by review</h2>
            <p className="text-sm leading-relaxed text-muted">
              Applicants submit a profile and statement. Management reviews every
              application before any offer or membership exists.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">03 · Experience</p>
            <h2 className="mb-2 text-xl">Approved, then bridged</h2>
            <p className="text-sm leading-relaxed text-muted">
              Requests and experiences are proposed, agreed and scheduled by management —
              the only sanctioned bridge to Gillian.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
