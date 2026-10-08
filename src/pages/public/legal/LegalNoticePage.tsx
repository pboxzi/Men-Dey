import {Link} from 'react-router-dom';

import {
  DocFacts,
  DocList,
  DocNote,
  DocSection,
  DocSub,
  DocTable,
  LegalShell,
} from './LegalShell';
import {LEGAL_CONTACT, LEGAL_SITE, LEGAL_UPDATED, type TocItem} from './legalNav';

const TOC: TocItem[] = [
  {id: 'operator', title: 'Who operates this platform'},
  {id: 'what-it-is', title: 'What this platform is'},
  {id: 'contact', title: 'How to reach us'},
  {id: 'documents', title: 'The documents that apply to you'},
  {id: 'ownership', title: 'Names, images and intellectual property'},
  {id: 'third-parties', title: 'Third-party services we rely on'},
  {id: 'no-promises', title: 'What we do not promise'},
  {id: 'data', title: 'Privacy, cookies and your data'},
  {id: 'liability', title: 'Liability in short'},
  {id: 'law', title: 'Law, jurisdiction and disputes'},
  {id: 'accessibility', title: 'Accessibility and formats'},
  {id: 'changes', title: 'Changes to this notice'},
];

const S = Object.fromEntries(TOC.map(({id, title}) => [id, {id, title}])) as Record<
  string,
  {id: string; title: string}
>;

/**
 * The legal notice: the identity behind the platform, how to reach a human and
 * the index that points at the three substantive documents. Doubles as the
 * landing point for anyone who arrives at /legal first.
 */
export function LegalNoticePage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="The legal notice, in plain language."
      toc={TOC}
      lede={
        <>
          <p>
            This page tells you who is behind the Gillian Anderson Management platform, how to
            reach a person here, and where to find the three documents that actually govern your
            use of it — the <Link to="/privacy">Privacy Policy</Link>, the{' '}
            <Link to="/terms">Terms of Service</Link> and our{' '}
            <Link to="/policies">Policies</Link>.
          </p>
          <p className="mt-4">
            We have written all of them the way we work: carefully, without padding, and in
            English you can act on. Nothing here is designed to be skimmed past a checkbox.
          </p>
        </>
      }
    >
      <DocSection spec={S.operator} n={1}>
        <p>
          The platform at <strong className="font-medium text-[#EAE4DA]">{LEGAL_SITE}</strong>, the
          member area it opens into, and the messaging, request, membership and experience tools
          within it are operated by <strong className="font-medium text-[#EAE4DA]">Gillian Anderson Management</strong>{' '}
          (&ldquo;the Office&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), the management team
          responsible for administering applications, memberships, requests and experiences on
          behalf of Gillian Anderson.
        </p>
        <p>
          For the purposes of data protection law, the Office is the controller of the personal
          data described in the <Link to="/privacy">Privacy Policy</Link>. Where this notice, the
          Privacy Policy, the Terms of Service or the Policies appear to conflict, the order of
          precedence is: mandatory law, then the Terms of Service, then the Privacy Policy, then
          the Policies, then this notice.
        </p>
        <DocFacts
          rows={[
            ['Trading name', 'Gillian Anderson Management'],
            ['Platform', (
              <>
                {LEGAL_SITE} — a private, non-public platform accessible by application and
                approval only
              </>
            )],
            ['Supervising function', 'Management team (the Office), acting for Gillian Anderson'],
            [
              'Legal correspondence',
              <>
                <a
                  href={`mailto:${LEGAL_CONTACT}`}
                  className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]"
                >
                  {LEGAL_CONTACT}
                </a>{' '}
                — please put the document name in the subject line
              </>,
            ],
            [
              'Registered particulars',
              'Company registration, registered office and VAT details are supplied in writing on legitimate request — for example to a member, a supplier or a supervisory authority.',
            ],
          ]}
        />
        <DocNote label="A note on how this platform works">
          <p>
            Everything here is deliberately human. There is no public directory, no open
            registration, no algorithmic feed and no automatic approval. A person reads what you
            send, and a person replies.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S['what-it-is']} n={2}>
        <p>
          This is a gated, private service. It exists so that applications, conversations,
          membership arrangements and experiences can be handled in one discreet place, mediated
          by the management team at every step.
        </p>
        <DocSub>What the platform provides</DocSub>
        <DocList>
          <li>An application flow through which you ask to join, and management reviews it.</li>
          <li>
            A member area containing your profile, your documents, your messages, your requests,
            your membership and any experiences proposed to you.
          </li>
          <li>
            Notifications by email and in the platform when something moves — a reply, an offer, a
            proposal, a payment request, a confirmation.
          </li>
          <li>A management console through which the team runs all of the above.</li>
        </DocList>
        <DocSub>What it is not</DocSub>
        <DocList>
          <li>
            Not a social network, fan community, dating service or public feed. There are no
            profiles to browse and nothing a member writes is published.
          </li>
          <li>
            Not an agency booking system that binds Gillian Anderson. Availability is never
            promised; see section 7.
          </li>
          <li>
            Not a payment institution. Card details are never requested, entered or stored here —
            see the <Link to="/policies">billing policy</Link>.
          </li>
          <li>
            Not open to the public. Search engines are asked not to index these pages, and access
            is limited to approved accounts.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.contact} n={3}>
        <p>Three ways to reach a person, in the order we recommend:</p>
        <DocTable
          head={['Channel', 'Best for', 'Response']}
          rows={[
            [
              'Inside the platform',
              'Anything attached to your account: requests, membership, documents, messages.',
              'Read by management during office hours; response times vary and are never guaranteed.',
            ],
            [
              'Live chat on the welcome page',
              'A quick question before you have an account.',
              'Monitored during office hours. Please do not send sensitive documents or personal details in chat.',
            ],
            [
              <>
                Email{' '}
                <a
                  href={`mailto:${LEGAL_CONTACT}`}
                  className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]"
                >
                  {LEGAL_CONTACT}
                </a>
              </>,
              'Legal notices, privacy requests, complaints, and anything requiring a written record.',
              'We acknowledge legal and privacy requests promptly and answer within the time required by applicable law.',
            ],
          ]}
        />
        <p>
          To exercise a privacy right, see section 16 of the{' '}
          <Link to="/privacy">Privacy Policy</Link> — it explains what to include so we can verify
          you safely and reply without delay.
        </p>
      </DocSection>

      <DocSection spec={S.documents} n={4}>
        <p>
          Four documents are published on this platform. Each is a standalone page with its own
          table of contents; the short version of what each covers is below.
        </p>
        <DocTable
          head={['Document', 'What it covers']}
          rows={[
            [
              <Link to="/legal" className="text-[#EAE4DA] underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">
                Legal notice
              </Link>,
              'Who operates the platform, how to reach us, third parties, the liability summary, and the document index you are reading now.',
            ],
            [
              <Link to="/privacy" className="text-[#EAE4DA] underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">
                Privacy Policy
              </Link>,
              'The personal data we collect, why we collect it, on what legal basis, who can see it, how long we keep it, and every right you can exercise.',
            ],
            [
              <Link to="/terms" className="text-[#EAE4DA] underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">
                Terms of Service
              </Link>,
              'The agreement between you and us: eligibility, accounts, requests, membership, experiences, payments, acceptable use, suspension and liability.',
            ],
            [
              <Link to="/policies" className="text-[#EAE4DA] underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">
                Policies
              </Link>,
              'The operating rules: conduct, discretion, content and copyright, billing and refunds, bookings, safety, accessibility, reporting and enforcement.',
            ],
          ]}
        />
        <DocNote label="The acknowledgement you accepted">
          <p>
            Before creating an account you read an acknowledgement titled &ldquo;How this space
            works&rdquo;. It sits alongside — and never replaces — these documents. The version
            number you accepted is stored with your account, so both of us can always establish
            which wording you agreed to and when. Ask us for a copy at any time.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.ownership} n={5}>
        <p>
          The platform, its design, its written content, its software and its original imagery are
          protected works. The name &ldquo;Gillian Anderson&rdquo;, related names, trade marks,
          photographs, likeness, voice, interviews and any material supplied by Gillian or her
          representatives are used here under licence to the Office for the operation of this
          service only.
        </p>
        <p>Subject to the Terms of Service, you may:</p>
        <DocList>
          <li>View and read these pages for your own personal, non-commercial purposes;</li>
          <li>Link to the welcome page or to a document on this site, unmodified and in context;</li>
          <li>
            Print a reasonable extract of a document for your own records, provided you do not
            alter it or present it as an official copy of anything else.
          </li>
        </DocList>
        <p>You may not, without our prior written consent:</p>
        <DocList>
          <li>
            Republish, sell, license, scrape or systematically extract any part of the platform or
            its content;
          </li>
          <li>
            Use any name, image, trade mark or member content here for advertising, promotion,
            merchandise, AI training data or any commercial purpose;
          </li>
          <li>
            Remove rights notices, attempt to defeat access controls, probe the platform for
            vulnerabilities, or use automated tools to access member areas;
          </li>
          <li>
            Present screenshots or extracts from member areas as though they were public material.
          </li>
        </DocList>
        <p>
          If you believe something on this platform infringes your rights, write to{' '}
          <a
            href={`mailto:${LEGAL_CONTACT}`}
            className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]"
          >
            {LEGAL_CONTACT}
          </a>{' '}
          with the location, your relationship to the work and a way to reach you. We take
          well-founded notices seriously and will respond promptly.
        </p>
      </DocSection>

      <DocSection spec={S['third-parties']} n={6}>
        <p>
          The platform is built on a small number of specialist providers. Each is engaged under a
          data-processing arrangement, and each is listed with its purpose in section 12 of the{' '}
          <Link to="/privacy">Privacy Policy</Link>. In brief:
        </p>
        <DocTable
          head={['Provider', 'Role']}
          rows={[
            ['Supabase', 'Database, authentication, file storage and the server-side functions that deliver email.'],
            ['Vercel', 'Hosting and delivery of the web application.'],
            ['Resend', 'Transactional email (verification, offers, confirmations, reminders) — sent by the platform, never a mailing list.'],
            ['Crisp', 'The optional live chat on the welcome page.'],
            ['Google Fonts', 'Delivery of the Playfair Display and Inter typefaces used across the site.'],
          ]}
        />
        <p>
          The platform also contains links to external sites and services we do not operate. Those
          have their own terms and privacy policies; we are not responsible for their content or
          practices, and a link is never an endorsement.
        </p>
      </DocSection>

      <DocSection spec={S['no-promises']} n={7}>
        <p>
          We would rather be explicit here than surprising later. Nothing on this platform
          constitutes a promise of:
        </p>
        <DocList>
          <li>
            <strong className="font-medium text-[#EAE4DA]">Gillian&rsquo;s availability.</strong>{' '}
            Dates, participation, response times and outcomes exist only once management has
            confirmed them in writing, and even then circumstances can change.
          </li>
          <li>
            <strong className="font-medium text-[#EAE4DA]">Approval.</strong> Creating an account
            begins an application; membership and access are granted at management&rsquo;s
            discretion and may be declined.
          </li>
          <li>
            <strong className="font-medium text-[#EAE4DA]">A reply to everything.</strong> We read
            every message with care; volume and timing mean we cannot always answer each one.
          </li>
          <li>
            <strong className="font-medium text-[#EAE4DA]">Continuous uptime.</strong> The service
            may be paused, maintained or altered, including to protect members or the Office.
          </li>
        </DocList>
        <p>
          Nothing here is professional, legal, financial, medical or psychological advice, and the
          platform does not create a fiduciary, advisory or agency relationship between you and
          Gillian Anderson.
        </p>
      </DocSection>

      <DocSection spec={S.data} n={8}>
        <p>
          Your privacy is treated as part of the service, not a setting within it. The{' '}
          <Link to="/privacy">Privacy Policy</Link> sets out in detail what is collected, why, on
          what legal basis, who may see it, where it is stored, how long it is kept and how to
          object. The short version:
        </p>
        <DocList>
          <li>Your account, messages, documents and requests are visible to you and to management.</li>
          <li>Nothing you write is published, ranked, recommended or used to build a public profile.</li>
          <li>We do not sell personal data, rent it, or share it with advertising networks.</li>
          <li>
            We use only essential storage plus the optional chat widget; there are no advertising
            or cross-site tracking cookies on this platform.
          </li>
          <li>The whole site is excluded from search engines, so pages you read are not indexed.</li>
        </DocList>
        <p>
          The <Link to="/policies">Policies</Link> contain the operational companion rules —
          including our content, billing, booking, safety and accessibility policies.
        </p>
      </DocSection>

      <DocSection spec={S.liability} n={9}>
        <p>
          This section is a summary for orientation only; the full position is in sections 16 to
          19 of the <Link to="/terms">Terms of Service</Link>, which prevail.
        </p>
        <DocList>
          <li>
            The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
            basis. We do not warrant that it will be uninterrupted, error-free or suitable for
            every purpose.
          </li>
          <li>
            We are responsible for foreseeable loss caused by our own breach. We are not liable for
            loss that was not foreseeable, for loss caused by events outside our reasonable control,
            or for business losses suffered by a consumer.
          </li>
          <li>
            Nothing in these documents excludes or limits liability for death or personal injury
            caused by negligence, for fraud or fraudulent misrepresentation, for wilful misconduct,
            or for any liability that applicable law does not permit to be excluded.
          </li>
        </DocList>
        <p>
          If something goes wrong, tell us early: most issues are resolved quickly when we hear
          about them at the time.
        </p>
      </DocSection>

      <DocSection spec={S.law} n={10}>
        <p>
          These documents are governed by the law of the jurisdiction in which the Office
          principally operates, and the courts of that jurisdiction have jurisdiction, except where
          mandatory consumer law gives you the right to bring proceedings in your own country of
          residence. We will confirm the specific jurisdiction in writing on request.
        </p>
        <p>
          Before starting any formal process, please contact us — almost every issue raised with
          care has been resolved by conversation. Where local law provides for it, we are open to
          good-faith mediation or an alternative dispute resolution route, and we will not treat
          your use of a complaint right as a reason to treat you differently.
        </p>
        <DocNote label="Consumer rights stay intact">
          <p>
            If you are dealing with us as a consumer, nothing in these documents removes the
            protections your local law provides — including rights that cannot be waived by
            contract. Where a term is unenforceable, the rest of the document continues to apply.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.accessibility} n={11}>
        <p>
          We want this documentation to be usable by everyone. The site is built with semantic
          headings, keyboard navigation, visible focus states, resizable text, reduced-motion
          support and contrast checked against the portrait background.
        </p>
        <DocList>
          <li>If any part of these documents is difficult to read, tell us what is getting in the way.</li>
          <li>
            We will provide any document in a larger type size, plain text, or another reasonable
            format on request, at no cost.
          </li>
          <li>
            Feedback and accessibility requests go to{' '}
            <a
              href={`mailto:${LEGAL_CONTACT}`}
              className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]"
            >
              {LEGAL_CONTACT}
            </a>
            .
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.changes} n={12}>
        <p>
          We review these documents as the platform evolves. When a change is material — anything
          that affects your rights, your data or what you have agreed to — we will give notice
          before it takes effect: by email, by a notice inside the platform, or both, with a
          reasonable period to read it.
        </p>
        <DocList>
          <li>
            The date at the top of every document is the date that wording took effect. Earlier
            versions are available on request.
          </li>
          <li>
            Where a change requires fresh consent (for example a new acknowledgement), we will ask
            for it explicitly rather than assuming it.
          </li>
          <li>
            Continued use of the platform after the effective date of a notified change means you
            accept the updated wording; if you do not agree, you may close your account before it
            takes effect.
          </li>
        </DocList>
        <DocFacts
          rows={[
            ['Current version', `Published ${LEGAL_UPDATED}`],
            ['Previous versions', <>Available from {LEGAL_CONTACT} on request</>],
            ['Related documents', (
              <>
                <Link to="/privacy" className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">Privacy Policy</Link>
                {' · '}
                <Link to="/terms" className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">Terms of Service</Link>
                {' · '}
                <Link to="/policies" className="underline decoration-[#C89B3C]/60 underline-offset-4 hover:text-[#C89B3C]">Policies</Link>
              </>
            )],
          ]}
        />
      </DocSection>
    </LegalShell>
  );
}
