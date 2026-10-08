import {Link} from 'react-router-dom';

import {
  DocFacts,
  DocList,
  DocNote,
  DocOrderedList,
  DocSection,
  DocSub,
  DocTable,
  LegalShell,
} from './LegalShell';
import {LEGAL_CONTACT, LEGAL_NAV, type TocItem} from './legalNav';

const TOC: TocItem[] = [
  {id: 'glance', title: 'Privacy at a glance'},
  {id: 'controller', title: 'Who controls your data'},
  {id: 'scope', title: 'What this policy covers'},
  {id: 'collect', title: 'The information we collect'},
  {id: 'sources', title: 'How information reaches us'},
  {id: 'why', title: 'Why we use it, and on what basis'},
  {id: 'messages', title: 'Your messages and content'},
  {id: 'files', title: 'Documents and files you upload'},
  {id: 'money', title: 'Membership, payments and records'},
  {id: 'storage-tech', title: 'Cookies, local storage and caching'},
  {id: 'no-tracking', title: 'Analytics, advertising and profiling'},
  {id: 'sharing', title: 'Who we share information with'},
  {id: 'transfers', title: 'International transfers'},
  {id: 'retention', title: 'How long we keep it'},
  {id: 'security', title: 'How we protect it'},
  {id: 'rights', title: 'Your rights, step by step'},
  {id: 'children', title: 'Children and age limits'},
  {id: 'changes', title: 'Changes, complaints and contact'},
];

const S = Object.fromEntries(TOC.map(({id, title}) => [id, {id, title}])) as Record<
  string,
  {id: string; title: string}
>;

const mailProps = (subject: string) => ({
  href: `mailto:${LEGAL_CONTACT}?subject=${encodeURIComponent(subject)}`,
  className: 'underline',
});

/**
 * Privacy Policy — the fullest of the four documents. Written to be read once
 * and understood: what is collected, on what basis, who can see it, for how
 * long, and exactly how to exercise a right.
 */
export function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Privacy"
      title="Your privacy, described properly."
      toc={TOC}
      lede={
        <>
          <p>
            This policy explains what personal information the Gillian Anderson Management
            platform collects, why it is collected, who is able to see it, where it is stored, how
            long it is kept, and the controls you can use at any time — including the ones that do
            not require you to write to us first.
          </p>
          <p className="mt-4">
            It is deliberately specific to this platform. There is no advertising network in the
            background, no data sold or rented, and no public profile generated from anything you
            share here.
          </p>
        </>
      }
    >
      <DocSection spec={S.glance} n={1}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We collect what the service needs.</strong>{' '}
            The details you give in your application and profile, the messages and requests you
            send, the documents you choose to upload, your membership and payment records, and a
            small amount of technical data required to keep your session secure.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We use it to run the service</strong> —
            to review applications, reply to you, arrange membership and experiences, send the
            notifications you ask for, keep accounts safe, and meet legal obligations.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Only you and management see it.</strong>{' '}
            Access inside the platform is controlled row by row: members see their own records,
            management sees the records it administers, and staff only see what their role needs.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We do not sell, rent or advertise with it.</strong>{' '}
            No data broker, no ad network, no behavioural profiling, no shadow profiles.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">You stay in control.</strong> Access,
            correction, deletion, restriction, objection, portability and withdrawal of consent are
            described in section 16.
          </li>
        </DocList>
        <DocNote label="If you only read one part">
          <p>
            Read sections 4, 12 and 16: what we hold, who can see it, and how to change or remove
            it. Everything else is the reasoning behind those three.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.controller} n={2}>
        <p>
          <strong className="font-semibold text-[#1E1E1E]">Gillian Anderson Management</strong> (the
          &ldquo;Office&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is the controller of the
          personal data described in this policy. The management team administers the platform on
          behalf of Gillian Anderson; the Office is the entity accountable to you for it.
        </p>
        <DocFacts
          rows={[
            ['Controller', 'Gillian Anderson Management (the Office)'],
            [
              'Privacy contact',
              <a {...mailProps('Privacy request')}>{LEGAL_CONTACT}</a>,
            ],
            ['Platform', 'The public site and the member area it opens into'],
            [
              'Data protection enquiries',
              'Mark the subject line &ldquo;Privacy&rdquo; and include the email address on your account so we can locate it safely.',
            ],
          ]}
        />
      </DocSection>

      <DocSection spec={S.scope} n={3}>
        <p>This policy applies to:</p>
        <DocList>
          <li>Visiting the public pages, including the welcome page and these legal documents;</li>
          <li>Starting, pausing or submitting an application to join;</li>
          <li>
            Holding an account and using the member area — profile, messages, requests,
            experiences, membership, documents and notifications;
          </li>
          <li>Correspondence with management, including live chat and email;</li>
          <li>Installing the platform as an app on your device.</li>
        </DocList>
        <p>It does not apply to:</p>
        <DocList>
          <li>
            External sites and services we link to, which set their own policies;
          </li>
          <li>
            The optional live chat widget once you have left the platform — the provider runs its
            own service, described in section 12;
          </li>
          <li>
            Anything you choose to share outside the platform (please keep it here instead — see
            section 7).
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.collect} n={4}>
        <p>
          The table below is the complete list of categories held. Fields marked optional are only
          present if you choose to complete them.
        </p>
        <DocTable
          head={['Category', 'What it includes', 'Why it exists']}
          rows={[
            [
              'Account and identity',
              'Full name, email address, password (stored only as a secure hash), email verification status, account role and status, the acknowledgement version you accepted and when.',
              'To create your account, prove it is yours, and record what you agreed to.',
            ],
            [
              'Contact details',
              'Phone number, country, city, postal address (optional), preferred contact method, and any WhatsApp number you supply.',
              'So management can reach you the way you asked to be reached.',
            ],
            [
              'About you',
              'Date of birth (optional), occupation, company, website, profile photograph (optional), and the free-text answers in your application — why you are joining, what you are looking for, what you hope to experience.',
              'So applications can be read as a person rather than a form, and requests can be understood in context.',
            ],
            [
              'Interests',
              'The experience categories you select during the application and afterwards.',
              'To shape what management proposes to you. Never used to build a public profile.',
            ],
            [
              'Conversations',
              'Messages between you and management, request threads and their status, subjects, timestamps and read receipts.',
              'To run the correspondence that is the whole point of the platform.',
            ],
            [
              'Documents and files',
              'Anything you upload: identity or reference material, agreements, briefs, financial documents — plus file name, type, size, category and who uploaded it.',
              'To hold what management needs for the arrangement you are part of.',
            ],
            [
              'Membership and money',
              'Membership tier, offer details, prices, benefits, accepted and declined offers, payment records and their status, membership card details.',
              'To administer membership accurately and keep a correct record.',
            ],
            [
              'Experiences and bookings',
              'Interests shown, proposals received, dates discussed, confirmations, reschedules, cancellations and notes management records.',
              'To arrange things properly, one at a time.',
            ],
            [
              'Technical and security',
              'IP address, browser and device type, pages visited, sign-in and sign-out times, session identifiers, failed sign-in attempts, error events, and the audit trail of management actions.',
              'To keep accounts safe, prevent abuse and be able to investigate if something goes wrong.',
            ],
            [
              'Your choices',
              'Notification preferences (requests, membership, experiences, messages) and chat-widget dismissal.',
              'To send only what you want to receive.',
            ],
            [
              'Support',
              'Live chat transcript when you use the widget on the welcome page, and any email you send to the addresses published here.',
              'To answer pre-application questions and handle legal or privacy requests.',
            ],
          ]}
        />
        <p>
          We do not knowingly collect special-category data (health, political opinions, religion,
          ethnicity, sexual orientation and the like). Please do not include it in free-text
          answers or uploaded documents unless it is genuinely necessary for what you are asking
          us to arrange — if it is, tell us and we will handle it with extra care.
        </p>
      </DocSection>

      <DocSection spec={S.sources} n={5}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">From you</strong> — form fields,
            messages, uploads, preferences, and conversations with management.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">From the platform as you use it</strong> —
            session and device information, page events, and security signals described in section 4.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">From management</strong> — notes,
            decisions, categorisations and records the team creates while handling your
            application, membership or requests.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">From your identity provider</strong> — if
            you ever sign in through a third-party provider, we receive the identifiers it returns
            (typically your email address) so we do not have to ask again.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">From providers acting for us</strong> —
            for example delivery status from our email service, so we know a message reached you.
          </li>
        </DocList>
        <p>
          We do not buy personal data, enrich it from data brokers, or scrape it from social
          networks.
        </p>
      </DocSection>

      <DocSection spec={S.why} n={6}>
        <p>
          Every use of your information rests on one of the legal bases below. Where the basis is
          consent, you may withdraw it at any time without affecting anything done before.
        </p>
        <DocTable
          head={['What we are doing', 'Information used', 'Legal basis']}
          rows={[
            [
              'Creating your account, verifying your email, keeping your sign-in secure',
              'Account and technical data',
              'Performance of a contract; legitimate interests in running a safe service',
            ],
            [
              'Reviewing your application and deciding whether to admit you',
              'Application answers, contact details, interests',
              'Legitimate interests in operating a private, curated community; steps taken at your request before entering a contract',
            ],
            [
              'Handling messages, requests, proposals, membership and experiences',
              'Conversations, membership, experience records',
              'Performance of a contract (or steps taken at your request before it)',
            ],
            [
              'Sending transactional email and in-app notifications you expect',
              'Email address, notification preferences',
              'Performance of a contract; legitimate interests in telling you something changed',
            ],
            [
              'Sending occasional news about the platform, where you have opted in',
              'Email address',
              'Consent — withdrawable at any time from your settings or by email',
            ],
            [
              'Keeping records of payments, agreements and acknowledgements',
              'Membership, payment, document and acknowledgement records',
              'Legitimate interests in accurate records; legal obligation where financial records must be kept',
            ],
            [
              'Preventing fraud, abuse and unauthorised access; investigating incidents',
              'Technical and security data, audit trail',
              'Legitimate interests in security and in establishing or defending legal claims',
            ],
            [
              'Responding to privacy requests, complaints and lawful demands',
              'Whatever is needed to verify and answer',
              'Legal obligation; legitimate interests in resolving issues properly',
            ],
            [
              'Improving the platform, measured by aggregated usage rather than individuals',
              'Usage data, de-identified or aggregated where possible',
              'Legitimate interests in maintaining a service people can rely on',
            ],
          ]}
        />
        <DocNote label="Consent, and taking it back">
          <p>
            Optional items — a profile photograph, a WhatsApp number, non-essential notifications,
            the chat widget — rely on consent. You can withdraw each of them in your settings, by
            clearing the widget, or with a single email. Withdrawing is as easy as giving.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.messages} n={7}>
        <p>
          Everything you write to management stays inside the platform: request threads, messages,
          membership conversations and notes on an experience. It is visible to you and to the
          management team members assigned to it, and to nobody else — no member can read another
          member&rsquo;s conversation, and nothing is surfaced in a public feed.
        </p>
        <DocList>
          <li>
            Conversations are stored so both sides have a complete history; that history is also
            what makes a decision auditable if it is ever questioned.
          </li>
          <li>
            Internal management notes attached to your record are visible to staff only, and are
            used to keep the service consistent — never to judge you outside the context of what
            you asked.
          </li>
          <li>
            Messages are transmitted over encrypted connections (TLS) and stored encrypted at rest
            by our hosting provider. They are not end-to-end encrypted: management must be able to
            read them to do its job, which is exactly the arrangement you agreed to.
          </li>
          <li>
            Please keep correspondence here. Sending your details through a personal email, social
            direct message or messaging app puts them outside this policy and outside our ability
            to protect them.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.files} n={8}>
        <p>
          Files you upload are stored in a private file store with access granted by role: you can
          see and manage your own documents, management sees the documents relevant to the
          arrangements it administers, and visibility is recorded on each file so it is clear
          whether it is private, shared with management, or management&rsquo;s own.
        </p>
        <DocList>
          <li>Each file keeps its title, category, type, size, uploader and timestamps.</li>
          <li>
            Files are served only to authenticated requests; there are no public links, and we do
            not index file contents.
          </li>
          <li>
            You can ask for a document you uploaded to be deleted. We may have to retain it if it
            is part of an agreement or a record we are required to keep — if so, we will tell you
            which one and why.
          </li>
          <li>
            Please do not upload anything you have no right to share — especially documents
            belonging to someone else without their permission.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.money} n={9}>
        <p>
          Membership is offered personally: management sends an offer with its price, benefits and
          validity, you accept or decline it, and payment is arranged through the method stated in
          the offer or in your membership record.
        </p>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We never see or store card numbers.</strong>{' '}
            The platform has no card form. Payment details are handled by whichever provider
            management names for the arrangement (bank transfer, card via Stripe, PayPal or a
            managed payment), and we record only the method, amount, date and status.
          </li>
          <li>
            Never send a card number, security code, password or bank login to management through
            messages, documents, email or chat. If anyone asks you for one, tell us immediately at{' '}
            <a {...mailProps('Suspicious payment request reported')}>{LEGAL_CONTACT}</a>.
          </li>
          <li>
            Payment records are kept as financial documentation: amounts, statuses, refunds and the
            offer they relate to. They are visible to you and to the staff who administer billing.
          </li>
          <li>
            Membership card details (such as a card reference or issue date) are stored so you can
            display your card — not as a payment instrument.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S['storage-tech']} n={10}>
        <p>
          This platform uses a deliberately small amount of browser storage. Here is exactly what
          is written to your device and why:
        </p>
        <DocTable
          head={['Item', 'Purpose', 'Lifetime']}
          rows={[
            [
              'Session and authentication tokens',
              'Keep you signed in securely between visits and prove requests come from you.',
              'Until you sign out, the session expires, or you clear site data.',
            ],
            [
              'Application draft (local key)',
              'Saves your answers as you move through the application so a closed tab does not lose your work. It never leaves your device until you submit.',
              'Until the application is submitted or you clear it; removed automatically on completion.',
            ],
            [
              'Acknowledgement record (local key)',
              'Remembers on this device that you read the acknowledgement, so you are not asked twice before the server confirms it.',
              'Until the server stores your acceptance, or you clear site data.',
            ],
            [
              'Install-prompt preference',
              'Remembers that you dismissed the &ldquo;add to home screen&rdquo; suggestion.',
              'Time-limited, then discarded.',
            ],
            [
              'Service worker cache',
              'Caches versioned static assets (icons, scripts, styles) so the app opens fast and works offline. Fresh HTML is always fetched from the network, so updates arrive immediately.',
              'Until a new version of the app is released, when old entries are purged.',
            ],
            [
              'Chat widget state (provider)',
              'Loads only if you use the optional live chat on the welcome page; the provider sets its own identifiers and cookies.',
              'Per the provider&rsquo;s own policy; never loaded inside your account.',
            ],
          ]}
        />
        <DocSub>Controlling it</DocSub>
        <DocList>
          <li>
            Your browser can show and delete site data per site — clearing it signs you out and
            removes the local draft.
          </li>
          <li>
            Blocking cookies and storage entirely will prevent sign-in, because the session token
            is how the platform knows it is you.
          </li>
          <li>
            Private or incognito windows discard all of this when the window closes, which is a
            perfectly good way to use the application flow on a shared device.
          </li>
          <li>
            The platform responds to your cookie choices by using as little as possible: there is
            no consent banner because there is nothing optional to consent to beyond the chat
            widget, which only loads when you open it.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S['no-tracking']} n={11}>
        <p>To be unambiguous, this platform does not:</p>
        <DocList>
          <li>Use advertising cookies, pixels or retargeting tags;</li>
          <li>Send your activity to ad networks or data brokers;</li>
          <li>Build behavioural profiles, lookalike audiences or interest graphs;</li>
          <li>Run third-party analytics scripts that follow you across other sites;</li>
          <li>Sell, rent, lease or otherwise monetise personal information;</li>
          <li>Use your messages or documents to train machine-learning models.</li>
        </DocList>
        <p>
          We do look at our own usage statistics — pages visited, errors, performance — in
          aggregate, so we can fix what is broken and keep the experience calm. Where possible
          these figures are de-identified before anyone reads them.
        </p>
        <DocNote label="Do Not Track and Global Privacy Control">
          <p>
            Because we do not engage in cross-site tracking in the first place, these signals make
            no practical difference here. We treat them as an instruction to keep it that way.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.sharing} n={12}>
        <p>
          We share information only with the parties below, only for the purposes stated, and
          never for their own marketing. Every provider is engaged under a written data-processing
          arrangement.
        </p>
        <DocTable
          head={['Recipient', 'What it does', 'Where it operates']}
          rows={[
            [
              'Supabase',
              'Hosts the database, authentication, file storage and the server-side functions that send email. Data is protected by row-level security and role-based access.',
              'United States (with safeguards described in section 13)',
            ],
            [
              'Vercel',
              'Serves the web application and its static assets.',
              'United States (with safeguards)',
            ],
            [
              'Resend',
              'Delivers transactional email we queue: verification, welcome, password reset, replies, offers, payment requests, confirmations and reminders. It receives the address and the message — nothing else.',
              'United States (with safeguards)',
            ],
            [
              'Crisp',
              'Provides the optional live chat on the welcome page. It receives the content of what you type there if you choose to use it.',
              'European Union / France',
            ],
            [
              'Google Fonts',
              'Delivers the typefaces used on the site. As with any web font request, your IP address is transmitted to the provider when a page loads.',
              'United States (with safeguards)',
            ],
            [
              'Management team and authorised staff',
              'Read and act on your records as required to run your application, membership, requests and experiences — each person only sees what their role needs.',
              'Wherever the team works, under internal access controls',
            ],
            [
              'Professional advisers and insurers',
              'Legal, accounting or insurance support, strictly on a need-to-know basis.',
              'As required',
            ],
            [
              'Courts, regulators or law enforcement',
              'Only where we are legally compelled, or where disclosure is necessary to protect someone from serious harm or to establish, exercise or defend legal claims. We will challenge requests that are excessive.',
              'As required by law',
            ],
            [
              'A successor organisation',
              'If the platform is restructured or transferred, the same protections travel with your data and we will tell you before anything changes.',
              'As applicable',
            ],
          ]}
        />
        <p>
          We do not sell personal data, and we do not disclose it to anyone for their own
          advertising. If that ever changed, we would ask for your consent first and explain who
          would receive what.
        </p>
      </DocSection>

      <DocSection spec={S.transfers} n={13}>
        <p>
          Our primary systems are provided from outside your country. Where personal data moves
          internationally, we rely on an approved transfer mechanism — standard contractual
          clauses, an adequacy decision, or the equivalent safeguards recognised in your
          jurisdiction — together with the technical and organisational measures described in
          section 15.
        </p>
        <DocList>
          <li>You can ask us which mechanism applies to a particular transfer.</li>
          <li>
            Data used only inside your own region stays there where the provider offers regional
            hosting and it does not impair the service.
          </li>
          <li>
            Copies kept for backup are subject to the same safeguards and retention rules as the
            live data.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.retention} n={14}>
        <p>
          We keep information for as long as it serves the purpose it was collected for, then
          delete or irreversibly anonymise it. The periods below are our working rules; where the
          law requires a longer minimum, the law wins.
        </p>
        <DocTable
          head={['What', 'Retention', 'Reason']}
          rows={[
            [
              'Account and profile data',
              'For the life of your account, then deleted or anonymised within a reasonable period of closure.',
              'To provide the service and handle post-closure questions.',
            ],
            [
              'Application drafts on your device',
              'Until submission, or when you clear site data.',
              'Convenience only — it is on your device, not ours, until you submit.',
            ],
            [
              'Unsuccessful applications',
              'Reviewed and deleted after a limited period unless you ask us to keep your interest for a future intake.',
              'So a declined application does not sit on file indefinitely.',
            ],
            [
              'Messages, requests and experience records',
              'For the life of your account, then removed in line with our deletion process.',
              'Continuity: the team needs the history to serve you consistently.',
            ],
            [
              'Uploaded documents',
              'Until you or management delete them, unless they form part of a record we must keep.',
              'As instructed, with a lawful basis for anything retained.',
            ],
            [
              'Payment and membership records',
              'Typically several years after the relevant financial year where accounting law requires it.',
              'Statutory financial record-keeping.',
            ],
            [
              'Acknowledgement versions you accepted',
              'For as long as the account exists, plus a short period afterwards.',
              'To be able to prove what was agreed, and when.',
            ],
            [
              'Security and audit logs',
              'For a limited period sufficient to investigate incidents and satisfy security reviews.',
              'Fraud prevention and accountability.',
            ],
            [
              'Queued and delivered email records',
              'A short operational window, so we can see whether a message was sent, delivered or failed.',
              'Reliability of notifications.',
            ],
            [
              'Live chat transcripts',
              'For a limited period at the provider, then deleted or retained by us only if folded into a support record.',
              'Continuity of support.',
            ],
            [
              'Consent and preference records',
              'For as long as the preference is relevant, plus evidence of the choice.',
              'To prove we honoured what you chose.',
            ],
          ]}
        />
        <p>
          Backups are rotated on a fixed schedule, so deletion from live systems is not always
          instantaneous — residual copies age out of the backup cycle and are not restored into use
          except during a controlled recovery.
        </p>
      </DocSection>

      <DocSection spec={S.security} n={15}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Access is enforced by the database,</strong>{' '}
            not by interface wishes: row-level security policies decide what each signed-in user
            and each staff role may read or write, so a hidden button is never the only thing
            standing between records.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Transport is encrypted</strong> (TLS)
            throughout, and storage is encrypted at rest by our providers.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Secrets stay server-side.</strong> Service
            keys, email credentials and administrative privileges live only in server functions and
            never ship inside the web app.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Staff access is minimal and logged.</strong>{' '}
            Roles grant only the permissions the role needs, sensitive actions are recorded in an
            audit trail, and privileged routes are restricted to administrators.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Password handling is standard and
            careful</strong> — hashed and salted by the authentication service, never visible to
            us, resettable only through a time-limited link sent to you.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Backups are taken regularly</strong> and
            tested through the platform&rsquo;s recovery procedures.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">You play a part too:</strong> a unique
            password, no reuse from another site, and telling us promptly if you think your account
            has been accessed by someone else.
          </li>
        </DocList>
        <p>
          No system can promise perfect security. If a breach affects your personal data, we will
          notify you and the relevant authority within the timeframes the law requires, describe
          what happened, and tell you what we are doing about it.
        </p>
      </DocSection>

      <DocSection spec={S.rights} n={16}>
        <p>
          Depending on where you live, you may have some or all of the rights below. We apply the
          widest reasonable standard to everyone, wherever they are.
        </p>
        <DocTable
          head={['Your right', 'What it means in practice']}
          rows={[
            ['Access', 'Ask for a copy of the personal data we hold about you, plus how it is used and who it is shared with.'],
            ['Correction', 'Have anything inaccurate or incomplete fixed — including profile details and application answers.'],
            ['Deletion', 'Ask us to erase data you no longer want us to hold, subject to records we must retain by law.'],
            ['Restriction', 'Ask us to pause how we use data while an issue is investigated or a decision is made.'],
            ['Objection', 'Object to uses based on legitimate interests, and to any direct marketing — always honoured.'],
            ['Portability', 'Receive your data in a structured, machine-readable format, or have it transmitted where technically feasible.'],
            ['Withdraw consent', 'Pull back consent for anything optional at any time, without affecting prior processing.'],
            ['Human decision-making', 'Ask for review of a decision made solely by automated means, if we ever introduce one (we have not).'],
            ['Complain', 'Lodge a complaint with your local supervisory authority; we will not treat this as a reason to treat you differently.'],
          ]}
        />
        <DocSub>How to exercise one</DocSub>
        <DocOrderedList>
          <li>
            Email{' '}
            <a {...mailProps('Privacy right request')}>{LEGAL_CONTACT}</a> with the subject
            &ldquo;Privacy request&rdquo;.
          </li>
          <li>
            Tell us which right you want to use, and include the email address on your account (or
            enough detail for us to find it). We ask only for what is needed to confirm the request
            is really yours — never for a copy of an identity document unless verification is
            genuinely necessary.
          </li>
          <li>
            We acknowledge promptly and respond within one month, extending by up to two further
            months for complex requests with notice to you.
          </li>
          <li>
            If we cannot act — for example because a record must be kept for tax — we explain why,
            and you may escalate to your supervisory authority.
          </li>
        </DocOrderedList>
        <DocNote label="Closing your account">
          <p>
            You can ask at any time and we will close it. Where deletion is possible we erase; where
            something must be retained (an agreement, a financial record) we tell you precisely what
            and why, keep it only for that purpose, and stop using it for everything else.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.children} n={17}>
        <p>
          This platform is for people aged 18 or over. We do not knowingly create accounts for
          children, and we do not knowingly collect their data.
        </p>
        <DocList>
          <li>
            If you believe a child has provided information to us, write to{' '}
            <a {...mailProps('Child data concern')}>{LEGAL_CONTACT}</a> and we will remove it
            promptly.
          </li>
          <li>
            Where local law sets a higher age of majority, that higher age applies to you.
          </li>
          <li>
            We may ask for confirmation of age where it is genuinely needed to admit someone to the
            platform — never as a way to harvest more data.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.changes} n={18}>
        <p>
          We review this policy whenever the platform or the law changes. Material changes are
          announced before they take effect — by email, by a notice inside the platform, or both —
          with time to read them, and we will ask for fresh consent where a change needs it. The
          date at the top of this page is when the current wording took effect, and previous
          versions are available on request.
        </p>
        <DocFacts
          rows={[
            [
              'Privacy requests',
              <a {...mailProps('Privacy request')}>{LEGAL_CONTACT}</a>,
            ],
            [
              'Before you write',
              'Include which right you are exercising and the email on your account, so we can verify and act without a second round of questions.',
            ],
            [
              'If you are unhappy',
              'Tell us first — we would rather fix it than have you escalate it. If you still wish to, you may complain to your local data protection authority.',
            ],
            [
              'The other documents',
              <span>
                {LEGAL_NAV.filter((item) => item.label !== 'Privacy').map((item, index, all) => (
                  <span key={item.to}>
                    <Link
                      to={item.to}
                      className="underline"
                    >
                      {item.label}
                    </Link>
                    {index < all.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </span>,
            ],
          ]}
        />
      </DocSection>
    </LegalShell>
  );
}
