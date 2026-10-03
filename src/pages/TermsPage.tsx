import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: '1. Agreement',
    body: [
      'These terms govern your use of this website and the private fan area operated by Gillian’s management office. By using the site or creating an account you accept them. If you do not accept them, please do not use the site.',
    ],
  },
  {
    heading: '2. What this site is',
    body: [
      'This is the official digital presence for Gillian Anderson: professional information, news, media, appearances and a private area for communication with the management office.',
      'The fan area is a free account. There are no paid tiers, points or memberships, and nothing offered here can be exchanged for money.',
    ],
  },
  {
    heading: '3. No guaranteed access or contact',
    body: [
      'Messages, requests and enquiries go to the management office. They are read, but replies are not guaranteed and nothing on this site promises contact with Gillian personally.',
      'No account, message or request can secure a meeting, call, appearance, audition, endorsement or any other outcome. Where something can be arranged, the management office will raise it with you directly.',
    ],
  },
  {
    heading: '4. Acceptable use',
    body: [
      'Keep your login credentials to yourself and tell the office if you believe your account has been compromised.',
      'Do not use the site to harass, impersonate, deceive, spam, or publish the private information of others.',
      'Do not attempt to gain unauthorised access to other accounts, the administration areas, or the systems that run the site.',
      'Content you submit must be yours to submit, or you must have the right to share it.',
    ],
  },
  {
    heading: '5. Your content',
    body: [
      'You keep ownership of what you write. You give the management permission to store it, read it and respond to it as needed to operate the service.',
      'Professional, media and partnership enquiries are handled as business correspondence by the office.',
    ],
  },
  {
    heading: '6. Content on this site',
    body: [
      'Biographical information, photography, video, news and appearance details published here are provided for information and may be updated or corrected at any time.',
      'The site and its design are protected material. You may read, link to and share it personally; you may not republish it commercially or present it as your own.',
    ],
  },
  {
    heading: '7. Availability and liability',
    body: [
      'The site is provided as it stands. We work to keep it accurate and available, but interruptions, errors and links to third-party services may occur.',
      'To the extent the law allows, the office is not liable for indirect or consequential loss arising from your use of the site.',
    ],
  },
  {
    heading: '8. Ending access',
    body: [
      'You can stop using the site at any time and ask for your account to be removed through the contact page.',
      'Access may be suspended or closed where these terms are broken, or where the site or its purpose changes.',
    ],
  },
  {
    heading: '9. Changes and contact',
    body: [
      'These terms may be updated; the date at the top of this page always reflects the current version.',
      'Questions about these terms can be sent through the contact page.',
    ],
  },
];

export default function TermsPage() {
  useSeo({
    title: 'Terms of Use',
    description: 'The terms that govern your use of the Gillian Anderson Management website and fan area.',
    canonicalPath: '/terms',
  });

  return (
    <article className="ed-shell ed-section">
      <header className="max-w-3xl">
        <span className="t-meta">Legal</span>
        <h1 className="t-h1 mt-3">Terms of Use</h1>
        <p className="t-caption mt-3">Last updated: October 2026</p>
        <p className="t-body mt-6">
          Plain terms for using this site and the private fan area. Nothing here sells access,
          contact or influence — the fan account is free and always will be.
        </p>
      </header>

      <div className="mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="t-h2" style={{ fontSize: '1.3rem' }}>
              {section.heading}
            </h2>
            <hr className="ed-rule-accent mt-3" />
            <div className="mt-4 space-y-3">
              {section.body.map((line) => (
                <p key={line} className="t-body-sm" style={{ color: 'var(--ed-ink-soft)' }}>
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-14 max-w-3xl border-t pt-6" style={{ borderColor: 'var(--ed-line)' }}>
        <p className="t-body-sm">
          See also our{' '}
          <Link to="/privacy" className="underline t-accent">
            privacy policy
          </Link>
          , or{' '}
          <Link to="/contact" className="underline t-accent">
            contact the management office
          </Link>{' '}
          with any question.
        </p>
      </footer>
    </article>
  );
}
