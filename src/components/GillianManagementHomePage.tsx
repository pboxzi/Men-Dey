import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Film,
  Home,
  Info,
  Mail,
  MessageSquare,
  Newspaper,
  User,
  Users,
} from 'lucide-react';
import { useSeo } from '../hooks/useSeo';
import { useAsync } from '../hooks/useAsync';
import { fetchNews } from '../services/content';
import Button from './ui/Button';

const STEPS = [
  {
    icon: User,
    title: 'You',
    body: 'Write to the office with a question, a request or an enquiry.',
  },
  {
    icon: Users,
    title: 'Management',
    body: 'The management office reads everything and decides what can move forward.',
  },
  {
    icon: MessageSquare,
    title: 'Response',
    body: 'Replies and updates arrive in your private fan area.',
  },
];

const CARDS = [
  {
    title: 'About',
    description: 'Biography, career and the work behind the management office.',
    icon: Info,
    image: '/assets/images/gillian_studio_portrait_1783349751129.jpg',
    to: '/about',
  },
  {
    title: 'Appearances',
    description: 'Approved public appearances, events and engagements.',
    icon: CalendarDays,
    image: '/assets/images/gillian_speaking_event_1783349739126.jpg',
    to: '/appearances',
  },
  {
    title: 'Media',
    description: 'Interviews, video, photography and press coverage.',
    icon: Film,
    image: '/assets/images/gillian_theatre_rehearsal_1783349680324.jpg',
    to: '/media',
  },
  {
    title: 'News',
    description: 'Announcements and updates published by the office.',
    icon: Newspaper,
    image: '/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg',
    to: '/news',
  },
  {
    title: 'Fan Access',
    description: 'A private area for messages, requests and official updates.',
    icon: MessageSquare,
    image: '/assets/images/gillian_mentoring_warmth_1783349719383.jpg',
    to: '/fan-access',
  },
  {
    title: 'Contact',
    description: 'Professional, media, event and partnership enquiries.',
    icon: Mail,
    image: '/assets/images/gillian_investigator_look_1783349694204.jpg',
    to: '/contact',
  },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function GillianManagementHomePage() {
  useSeo({
    title: undefined,
    description:
      'The official digital presence of Gillian Anderson’s management office — biography, appearances, media, news and private fan access.',
    canonicalPath: '/',
  });

  const news = useAsync(fetchNews, []);
  const latest = news.data?.[0] ?? null;

  return (
    <>
      {/* Hero */}
      <section className="relative border-b" style={{ borderColor: 'var(--ed-line)' }}>
        <div
          className="relative flex min-h-[clamp(26rem,68vh,40rem)] w-full items-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/assets/images/gillian_banner_hero.jpg')", backgroundPosition: 'center right' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #FAF6F0 0%, rgba(250,246,240,.94) 38%, rgba(250,246,240,.35) 62%, rgba(250,246,240,0) 100%)',
            }}
          />
          <div className="ed-shell relative z-10 py-16 sm:py-20">
            <div className="max-w-[34rem]">
              <span className="t-meta">Gillian Anderson Management</span>
              <h1 className="t-display mt-4" style={{ fontSize: 'clamp(2.1rem,4.4vw,3.4rem)' }}>
                The official presence of Gillian Anderson’s management office.
              </h1>
              <hr className="ed-rule-accent my-6" />
              <p className="t-body" style={{ maxWidth: '32rem' }}>
                Professional representation, public appearances, media, news — and a private area
                where fans can communicate directly with the office.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/fan-access" variant="primary" size="lg">
                  Fan Access
                </Button>
                <Button to="/contact" variant="secondary" size="lg">
                  Contact Management
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="ed-section">
        <div className="ed-shell text-center">
          <span className="t-meta">How it works</span>
          <h2 className="t-h2 mt-3">You → Management → Response</h2>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="contents">
                  <div className="flex flex-col items-center text-center">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: 'var(--ed-accent-soft)', color: 'var(--ed-accent-strong)' }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="t-h3 mt-4" style={{ fontSize: '1.05rem' }}>
                      {step.title}
                    </h3>
                    <p className="t-body-sm mt-2" style={{ maxWidth: '16rem', color: 'var(--ed-muted)' }}>
                      {step.body}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <span
                      className="hidden select-none items-center justify-center pt-5 text-xl md:flex"
                      style={{ color: 'var(--ed-line-strong)' }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore */}
      <section className="ed-section" style={{ background: 'var(--ed-bg-alt)' }}>
        <div className="ed-shell">
          <div className="mb-8">
            <span className="t-meta">Explore</span>
            <h2 className="t-h2 mt-3">Everything on this site</h2>
            <hr className="ed-rule-accent mt-4" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="group overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: 'var(--ed-line)' }}
                >
                  <div className="relative h-32 overflow-hidden" style={{ background: 'var(--ed-bg-alt)' }}>
                    <img
                      src={card.image}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className="absolute -bottom-5 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border bg-white shadow-sm"
                      style={{ borderColor: 'var(--ed-line)', color: 'var(--ed-accent-strong)' }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-5 pb-5 pt-8 text-center">
                    <h3 className="t-h3" style={{ fontSize: '1.05rem' }}>
                      {card.title}
                    </h3>
                    <p className="t-body-sm mt-2" style={{ color: 'var(--ed-muted)' }}>
                      {card.description}
                    </p>
                    <span className="mt-3 inline-block text-sm transition-colors group-hover:text-[var(--ed-accent)]" style={{ color: 'var(--ed-line-strong)' }}>
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest from the office */}
      {latest && (
        <section className="ed-section">
          <div className="ed-shell">
            <div className="flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--ed-line)', background: 'var(--ed-bg-alt)' }}>
              <div className="flex items-start gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{ borderColor: 'var(--ed-line)', color: 'var(--ed-accent-strong)' }}
                >
                  <Home className="h-5 w-5" />
                </span>
                <div>
                  <span className="t-meta">Latest from the office</span>
                  <h2 className="t-h3 mt-1" style={{ fontSize: '1.1rem' }}>
                    <Link to={`/news/${latest.slug}`} className="transition-opacity hover:opacity-70">
                      {latest.title}
                    </Link>
                  </h2>
                  {latest.excerpt && (
                    <p className="t-body-sm mt-1" style={{ color: 'var(--ed-muted)' }}>
                      {latest.excerpt}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 pl-14 sm:pl-0">
                <span className="t-caption" style={{ color: 'var(--ed-muted)' }}>
                  {formatDate(latest.published_at)}
                </span>
                <Button to="/news" variant="secondary" size="sm">
                  All News
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
