import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

/** Canonical origin — used for og:url, the canonical link and share image. */
export const SITE_URL = 'https://www.cmagency.me';
const SITE_NAME = 'Gillian Anderson Management';
const SHARE_IMAGE = `${SITE_URL}/assets/images/gillian_banner_1920.jpg`;

const HOME_DESCRIPTION =
  'A private, gated management platform. Users and applicants communicate only through management for membership, requests and approved experiences.';
const DEFAULT_DESCRIPTION = `Private platform of ${SITE_NAME}.`;

/**
 * One entry per route family. A trailing slash marks a detail page
 * (`/management/fans/` is one fan, `/management/fans` the list); the longest
 * matching prefix wins, so authoring order does not matter.
 */
const ROUTES: Array<{prefix: string; title: string; description?: string}> = [
  // Member area
  {prefix: '/dashboard/requests/new', title: 'New request'},
  {prefix: '/dashboard/requests/', title: 'Request'},
  {
    prefix: '/dashboard/requests',
    title: 'My requests',
    description: 'Submit and track personal requests with management.',
  },
  {prefix: '/dashboard/messages/', title: 'Conversation'},
  {prefix: '/dashboard/messages', title: 'Messages'},
  {prefix: '/dashboard/notifications/', title: 'Notification'},
  {prefix: '/dashboard/notifications', title: 'Notifications'},
  {prefix: '/dashboard/experiences/', title: 'Experience'},
  {prefix: '/dashboard/experiences', title: 'Experiences'},
  {prefix: '/dashboard/membership/offers', title: 'Membership offers'},
  {prefix: '/dashboard/membership/card', title: 'Membership card'},
  {prefix: '/dashboard/membership/', title: 'Membership details'},
  {
    prefix: '/dashboard/membership',
    title: 'Membership',
    description: 'Your membership tier, card and current offers.',
  },
  {prefix: '/dashboard/documents', title: 'Documents'},
  {prefix: '/dashboard/profile', title: 'Profile'},
  {prefix: '/dashboard/settings', title: 'Settings'},
  {
    prefix: '/dashboard',
    title: 'Dashboard',
    description: 'Your member dashboard: requests, messages, membership and documents.',
  },
  {prefix: '/home', title: 'Home'},

  // Management console
  {prefix: '/management/fans/', title: 'Fan profile'},
  {prefix: '/management/fans', title: 'Fans'},
  {prefix: '/management/applicants/', title: 'Applicant'},
  {prefix: '/management/applicants', title: 'Applicants'},
  {prefix: '/management/messages/', title: 'Conversation'},
  {prefix: '/management/messages', title: 'Messages'},
  {prefix: '/management/requests/', title: 'Request'},
  {prefix: '/management/requests', title: 'Requests'},
  {prefix: '/management/memberships/', title: 'Membership'},
  {prefix: '/management/memberships', title: 'Memberships'},
  {prefix: '/management/experiences/', title: 'Experience'},
  {prefix: '/management/experiences', title: 'Experiences'},
  {prefix: '/management/bookings', title: 'Bookings'},
  {prefix: '/management/calendar', title: 'Calendar'},
  {prefix: '/management/proposals', title: 'Proposals'},
  {prefix: '/management/payments', title: 'Payments'},
  {prefix: '/management/agreements', title: 'Agreements'},
  {prefix: '/management/documents', title: 'Documents'},
  {prefix: '/management/cms', title: 'Content'},
  {prefix: '/management/media', title: 'Media'},
  {prefix: '/management/tasks', title: 'Tasks'},
  {prefix: '/management/staff', title: 'Staff'},
  {prefix: '/management/notifications', title: 'Notifications'},
  {prefix: '/management/settings', title: 'Settings'},
  {prefix: '/management/security', title: 'Security'},
  {prefix: '/management/audit', title: 'Audit log'},
  {
    prefix: '/management',
    title: 'Management console',
    description:
      'Operations console for fans, applicants, requests, messages, payments and content.',
  },

  // Public and auth
  {
    prefix: '/sign-in',
    title: 'Sign in',
    description: 'Sign in to your private member account.',
  },
  {prefix: '/acknowledgement', title: 'Acknowledgement'},
  {
    prefix: '/create-account',
    title: 'Apply for membership',
    description: 'Apply to join the private Gillian Anderson membership.',
  },
  {prefix: '/verify-email', title: 'Verify email'},
  {prefix: '/forgot-password', title: 'Forgot password'},
  {prefix: '/reset-password', title: 'Reset password'},
  {prefix: '/forbidden', title: 'Access denied'},
  {
    prefix: '/legal',
    title: 'Legal notice',
    description: 'Legal notice and publisher information.',
  },
  {
    prefix: '/privacy',
    title: 'Privacy policy',
    description: 'How your personal information is collected, used and protected.',
  },
  {
    prefix: '/terms',
    title: 'Terms of service',
    description: 'The terms governing access to and use of the platform.',
  },
  {
    prefix: '/policies',
    title: 'Policies',
    description: 'Platform policies and community guidelines.',
  },
  {prefix: '/', title: SITE_NAME, description: HOME_DESCRIPTION},
];

const ROUTES_BY_LENGTH = [...ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Gives every route its own browser-tab title, meta description and social
 * preview card, replacing the one static title the document shipped with.
 * Only the landing page is indexable (see RobotsMeta), so the canonical link
 * is maintained for `/` alone.
 */
export function DocumentMeta() {
  const {pathname} = useLocation();

  useEffect(() => {
    const match =
      ROUTES_BY_LENGTH.find((route) => pathname.startsWith(route.prefix)) ??
      {title: 'Page not found', description: DEFAULT_DESCRIPTION};
    const title = match.title === SITE_NAME ? SITE_NAME : `${match.title} · ${SITE_NAME}`;
    const description = match.description ?? DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${pathname}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);

    if (pathname === '/') {
      upsertMeta('property', 'og:image', SHARE_IMAGE);
      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `${SITE_URL}/`);
    } else {
      // A canonical on a noindex page only confuses crawlers.
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }
  }, [pathname]);

  return null;
}
