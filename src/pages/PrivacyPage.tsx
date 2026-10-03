import { useSeo } from '../hooks/useSeo';

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: 'What we collect',
    body: [
      'Account details: your name, email address and country, provided when you create a fan account.',
      'Optional profile details: a short biography, a favourite performance and a preferred contact detail, if you choose to add them.',
      'Messages and requests you send to the management office, together with any replies, so that a conversation can continue across sessions.',
      'Basic correspondence records: enquiry forms submitted through the contact page.',
    ],
  },
  {
    heading: 'Why we hold it',
    body: [
      'To run your account and keep you signed in securely.',
      'To deliver your messages, requests and replies to the management office and show you their status.',
      'To send you notifications you have asked for, such as replies or official announcements.',
      'To understand, in aggregate, which parts of the site are used so that the public information stays accurate.',
    ],
  },
  {
    heading: 'What we never do',
    body: [
      'We do not sell, rent or trade your personal information to advertisers or data brokers.',
      'We do not use your messages for marketing or train public models on them.',
      'We do not publish your account details, messages or requests anywhere on the public site.',
      'We do not require payment details — there is nothing to buy on this site.',
    ],
  },
  {
    heading: 'Who can see it',
    body: [
      'You can see everything held about your own account from the profile and settings pages of your fan area.',
      'The management office can see the messages and requests you send it, because that is the point of sending them.',
      'Service providers that host the site and deliver email process data only on our instructions and under their own security commitments.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'Account information is kept for as long as your account exists.',
      'Messages, requests and enquiry records are kept so that history and follow-ups remain possible, then removed when they are no longer needed.',
      'You can ask for your account and associated records to be deleted at any time using the contact page.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    body: [
      'The site uses browser storage to keep you signed in between visits and to remember interface preferences.',
      'We do not use third-party advertising or cross-site tracking cookies.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Questions about this policy, or a request to access, correct or delete your information, can be sent through the contact page and will reach the management office.',
    ],
  },
];

export default function PrivacyPage() {
  useSeo({
    title: 'Privacy Policy',
    description: 'How Gillian Anderson Management collects, uses and protects your personal information.',
    canonicalPath: '/privacy',
  });

  return (
    <article className="ed-shell ed-section">
      <header className="max-w-3xl">
        <span className="t-meta">Legal</span>
        <h1 className="t-h1 mt-3">Privacy Policy</h1>
        <p className="t-caption mt-3">Last updated: October 2026</p>
        <p className="t-body mt-6">
          This policy explains what information this site collects, why it is held, and the
          choices you have. It applies to the public website and to the private fan area.
        </p>
      </header>

      <div className="mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="t-h2" style={{ fontSize: '1.3rem' }}>
              {section.heading}
            </h2>
            <hr className="ed-rule-accent mt-3" />
            <ul className="mt-4 space-y-3">
              {section.body.map((line) => (
                <li key={line} className="t-body-sm" style={{ color: 'var(--ed-ink-soft)' }}>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
