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
import {LEGAL_CONTACT, type TocItem} from './legalNav';

const TOC: TocItem[] = [
  {id: 'accepting', title: 'Accepting these terms'},
  {id: 'eligibility', title: 'Who may use the service'},
  {id: 'application', title: 'Your application and approval'},
  {id: 'acknowledgement', title: 'The acknowledgement'},
  {id: 'account', title: 'Your account and its security'},
  {id: 'how-it-works', title: 'How the service works'},
  {id: 'requests', title: 'Requests and replies'},
  {id: 'experiences', title: 'Experiences and bookings'},
  {id: 'membership', title: 'Membership'},
  {id: 'payments', title: 'Payments, fees and refunds'},
  {id: 'acceptable-use', title: 'Acceptable use'},
  {id: 'prohibited', title: 'What is strictly prohibited'},
  {id: 'your-content', title: 'Your content and licence'},
  {id: 'our-ip', title: 'Our intellectual property'},
  {id: 'third-parties', title: 'Third-party services'},
  {id: 'disclaimers', title: 'Disclaimers — what is not promised'},
  {id: 'liability', title: 'Limitation of liability'},
  {id: 'termination', title: 'Suspension and termination'},
  {id: 'changes', title: 'Changes to the service or these terms'},
  {id: 'law', title: 'Governing law and disputes'},
  {id: 'contact', title: 'Contact'},
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
 * Terms of Service — the agreement between a member (or applicant) and the
 * Office. Written to be read, not skimmed: every promise the platform does and
 * does not make lives here.
 */
export function TermsOfServicePage() {
  return (
    <LegalShell
      eyebrow="Terms"
      title="The terms we both agree to."
      toc={TOC}
      lede={
        <>
          <p>
            These Terms of Service are the agreement between you and Gillian Anderson Management
            for the use of this platform — the public site, the application flow, the member area,
            messaging, requests, membership and experiences.
          </p>
          <p className="mt-4">
            Read them once, properly. They explain what you can expect from us, what we expect in
            return, and the parts where we must be honest that some things are arranged personally
            and can never be guaranteed.
          </p>
        </>
      }
    >
      <DocSection spec={S.accepting} n={1}>
        <p>
          By visiting the public pages you agree to use them lawfully. By creating an account,
          submitting an application or using the member area, you agree to be bound by these terms
          in full, together with the{' '}
          <Link to="/privacy">Privacy Policy</Link>, the <Link to="/policies">Policies</Link> and
          the acknowledgement you accepted before registering.
        </p>
        <DocList>
          <li>
            If you do not agree, please do not create an account — and tell us, so we can delete
            anything you started.
          </li>
          <li>
            These terms apply from the moment you accept them and continue for as long as you hold
            an account.
          </li>
          <li>
            Where you use the platform for an organisation, you confirm you are authorised to bind
            it, and &ldquo;you&rdquo; then means you and that organisation.
          </li>
          <li>
            If any part of these terms is held unenforceable, the remainder continues in effect,
            and the unenforceable part is applied to the maximum extent permitted.
          </li>
          <li>
            Our failure to enforce a right once is not a waiver of it later.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.eligibility} n={2}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Age.</strong> You must be at least 18
            years old, or the age of majority where you live if that is higher.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Capacity.</strong> You must be able to
            enter a binding contract, and not be barred from doing so under applicable law.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Truthful information.</strong> Details
            you provide must be accurate and yours. Applying under a false name, or with contact
            details you do not control, is a breach of these terms.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">One account each.</strong> Accounts are
            personal and may not be shared, sold, lent or transferred. Household members each need
            their own.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Jurisdiction.</strong> You use the
            platform from a location where doing so is lawful; it is your responsibility to know
            the rules that apply to you.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.application} n={3}>
        <p>
          Access to the member area starts with an application that management reads and reviews.
          Creating an account only opens the door — it is not admission, and it does not create any
          expectation of admission.
        </p>
        <DocTable
          head={['Stage', 'What happens', 'What it means for you']}
          rows={[
            ['Apply', 'You complete the steps and submit your answers.', 'An application, not a membership. You may be asked follow-up questions.'],
            ['Review', 'Management reads it and considers it in context.', 'Timing varies. Please do not submit the same application through several channels.'],
            ['Decision', 'You are admitted, asked for more, or declined.', 'Approval is at management&rsquo;s discretion and is not purchased. A decline is final for that application unless we invite you to reapply.'],
            ['Welcome', 'If admitted, you receive access and next steps.', 'Your membership benefits, if any, begin only with an offer you accept — not with the account itself.'],
          ]}
        />
        <DocList>
          <li>We may ask for clarification, references or documentation as part of a review.</li>
          <li>
            Withdrawing an application is always possible — just tell us and we will remove what
            we can, subject to anything we must retain (see the{' '}
            <Link to="/privacy">Privacy Policy</Link>).
          </li>
          <li>
            Admission is personal: it gives you access as an individual and does not extend to
            guests, colleagues or family members.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.acknowledgement} n={4}>
        <p>
          Before creating an account you are shown an acknowledgement titled &ldquo;How this space
          works&rdquo;. By continuing you confirm you have read, understood and accepted it of your
          own accord.
        </p>
        <DocList>
          <li>The version number and the time you accepted are stored with your account.</li>
          <li>
            You may ask for a copy of any version at any time, including the one you accepted.
          </li>
          <li>
            If we publish a new acknowledgement that requires fresh consent, we will ask you
            explicitly rather than assume it.
          </li>
          <li>
            The acknowledgement explains the shape of the service: management is always the bridge,
            approval is discretionary, experiences are arranged individually, and availability is
            never promised.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.account} n={5}>
        <DocSub>Keeping it safe</DocSub>
        <DocList>
          <li>
            You are responsible for your credentials and for activity carried out through your
            account. Keep your password unique to this platform.
          </li>
          <li>
            Tell us immediately at{' '}
            <a {...mailProps('Unauthorised account access')}>{LEGAL_CONTACT}</a> if you suspect
            unauthorised use. Early notice lets us lock things down quickly.
          </li>
          <li>
            Sessions are authenticated and time-limited; signing out on a shared device is always
            wise.
          </li>
          <li>
            We may ask you to re-verify, update credentials, or take a security step if we detect
            something unusual. Please treat such a request as genuine and act on it promptly.
          </li>
        </DocList>
        <DocSub>Things we may do to an account</DocSub>
        <DocList>
          <li>Require correction of information that is inaccurate or out of date;</li>
          <li>Limit functionality while a security or conduct concern is investigated;</li>
          <li>
            Close dormant accounts after a long period of inactivity, after attempting to reach
            you first;
          </li>
          <li>Refuse or withdraw access where these terms or the Policies are breached.</li>
        </DocList>
      </DocSection>

      <DocSection spec={S['how-it-works']} n={6}>
        <p>
          The single most important thing to understand:{' '}
          <strong className="font-semibold text-[#1E1E1E]">management is always the bridge.</strong>{' '}
          Nothing on this platform creates a direct, unmediated channel between you and Gillian
          Anderson, and nothing is arranged automatically.
        </p>
        <DocList>
          <li>Every message, request, membership decision and experience passes through the Office.</li>
          <li>
            Staff act within the authority given to them by the Office. Nobody except Gillian
            personally can commit her to anything, and even then only in writing.
          </li>
          <li>
            Information you receive inside the platform — proposals, offers, confirmations — is the
            authoritative version. Screenshots shared elsewhere, or messages on other channels, do
            not change it.
          </li>
          <li>
            The platform may be paused, maintained or improved at any time. We will try to give
            notice of planned downtime, but cannot promise uninterrupted access.
          </li>
        </DocList>
        <DocNote label="What creating an account does not do">
          <p>
            It does not guarantee membership, a reply to every message, a meeting, a booking, or any
            particular amount of attention from Gillian. Those things are arranged personally, one
            by one.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.requests} n={7}>
        <p>
          You may send requests — a question, an invitation, an idea, a proposal for something to
          arrange. What happens next follows a clear path:
        </p>
        <DocOrderedList>
          <li>You send a request with enough detail for it to be understood.</li>
          <li>Management reads it, and may come back with questions or clarifications.</li>
          <li>
            It is considered in context alongside availability, logistics, suitability and
            Gillian&rsquo;s commitments outside this platform.
          </li>
          <li>
            Management responds with a decision, a counter-proposal, a request for more
            information, or — occasionally — a courteous decline.
          </li>
          <li>
            If it proceeds, terms, dates and any fees are confirmed in writing inside the platform
            before anything is treated as agreed.
          </li>
        </DocOrderedList>
        <DocList>
          <li>
            Sending a request is not a booking, reservation, hold or commitment by anyone — yours
            or theirs.
          </li>
          <li>
            We cannot guarantee a reply to every request, a response within a particular time, or a
            particular outcome.
          </li>
          <li>
            Duplicate or repeated requests for the same thing do not improve the chances and may be
            merged.
          </li>
          <li>
            Please keep sensitive material in the platform rather than in the subject line or an
            attachment sent from outside.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.experiences} n={8}>
        <p>
          Experiences are proposed, reviewed, scheduled and confirmed individually by management.
          Showing interest is a wonderful first step — it is not, by itself, a booking.
        </p>
        <DocTable
          head={['Stage', 'Status', 'Binding?']}
          rows={[
            ['Interest shown', 'You indicate that something appeals to you.', 'No — nothing is held or reserved.'],
            ['Proposal received', 'Management sends dates, scope, terms and any price.', 'No — it is an offer with a validity period.'],
            ['Accepted by you', 'You accept the proposal inside the platform.', 'Yes, as to your side — subject to final confirmation.'],
            ['Confirmed by management', 'Management confirms in writing and schedules it.', 'Yes — this is the point at which an experience is arranged.'],
          ]}
        />
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Availability can never be promised.</strong>{' '}
            Commitments, travel, health, filming schedules and private life all intervene; dates
            can move even after a confirmation, and we will tell you as early as we can.
          </li>
          <li>
            Rescheduling is handled case by case. Where you need to change plans, tell us as soon
            as you know — good notice is what makes a substitute arrangement possible.
          </li>
          <li>
            Late cancellation, non-attendance and no-shows are treated under the booking policy in
            the <Link to="/policies">Policies</Link> and any specific terms stated in your
            proposal.
          </li>
          <li>
            Experiences are personal and non-transferable: the person confirmed is the person who
            attends, unless management agrees otherwise in writing.
          </li>
          <li>
            Conduct that makes an experience unworkable — intoxication, harassment, disregard for
            safety instructions — may result in it being ended, with the consequences set out in
            the <Link to="/policies">Policies</Link>.
          </li>
          <li>
            Events outside anyone&rsquo;s reasonable control may force a change or cancellation. If
            that happens we will offer the fairest available remedy, which will take account of
            what has already been incurred.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.membership} n={9}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Membership is by offer, not purchase.</strong>{' '}
            Management sends an offer setting out the tier, price, benefits, billing period and
            validity. Membership begins when you accept it and any required payment is confirmed.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">You choose each time.</strong> Offers
            expire if not accepted by their validity date; nothing renews automatically unless the
            offer you accepted says so, in which case we will remind you before it does.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Benefits are personal</strong> to you,
            non-transferable, non-exchangeable for cash, and subject to availability where they
            involve time or arrangements.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Terms attached to a specific offer</strong>{' '}
            supplement these terms for that membership; if they differ, the offer&rsquo;s specific
            terms prevail for that membership only.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">End of membership</strong> — you may
            leave at any time; management may end or decline a membership under section 18 and the
            enforcement provisions of the <Link to="/policies">Policies</Link>. Benefits stop when
            membership ends, and fees already properly paid are handled under the refund rules in
            the <Link to="/policies">Policies</Link>.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.payments} n={10}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Prices are stated in the offer or
            payment request</strong> and are exclusive of taxes unless it says otherwise.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Payment methods</strong> are named by
            management for each arrangement (for example bank transfer, card via a payment provider,
            PayPal, or a managed payment) together with instructions inside the platform.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We never ask for card numbers here.</strong>{' '}
            There is no card form on this platform, and management will never ask you to send a
            card number, security code, password or bank login through messages, documents, email
            or chat.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">When payment is due</strong> — by the
            date in the offer or payment request. Access or activation can be withheld until
            payment is confirmed; management records confirmation manually, so allow for processing
            time.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Late payment</strong> may mean an offer
            lapses, a date is released, or activation is delayed. We will tell you before treating
            an offer as lapsed wherever we can.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Refunds</strong> are handled under the
            refund rules in the <Link to="/policies">Policies</Link> and any specific terms in your
            offer, and always in line with mandatory consumer rights where they apply.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Suspected fraud</strong> — we may pause
            a payment or an activation while we check something that looks wrong. We will explain
            and, where we were mistaken, put it right quickly.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S['acceptable-use']} n={11}>
        <p>
          This is a curated, professionally run office. Use it the way you would want a considered
          personal arrangement to be run:
        </p>
        <DocList>
          <li>Be accurate about who you are and what you are asking for.</li>
          <li>Be courteous and professional in every message — disagreement is fine; hostility is not.</li>
          <li>Keep what you learn here private: other members, their details, their requests, their presence.</li>
          <li>Send only what is relevant; do not flood threads or repeat declined requests.</li>
          <li>Use the platform for its purpose — arrangements through management — not for commerce, promotion or solicitation.</li>
          <li>Respect decisions: a decline, a boundary or a schedule is not an opening for negotiation.</li>
          <li>Tell us if something feels wrong — a message, an approach from someone claiming to act for us, a payment request you did not expect.</li>
        </DocList>
      </DocSection>

      <DocSection spec={S.prohibited} n={12}>
        <p>You must not:</p>
        <DocOrderedList>
          <li>
            Impersonate anyone, misrepresent your identity or affiliation, or apply using another
            person&rsquo;s details.
          </li>
          <li>
            Share, sell, lend or transfer your account, or allow another person to use it under
            your credentials.
          </li>
          <li>
            Post or send content that is unlawful, threatening, harassing, hateful, exploitative,
            defamatory, or that sexualises or endangers anyone.
          </li>
          <li>
            Solicit other members, advertise, promote a business, run competitions, or collect
            other members&rsquo; details for contact outside the platform.
          </li>
          <li>
            Attempt to access data that is not yours, probe or scan the platform, defeat access
            controls, or test security without our written authorisation.
          </li>
          <li>
            Use automated tools to scrape, harvest, index or mass-download anything here, or to
            submit requests at volume.
          </li>
          <li>
            Introduce malware, overload the service, interfere with other sessions, or do anything
            likely to impair performance or availability.
          </li>
          <li>
            Upload material you have no right to share — including someone else&rsquo;s personal
            data, private correspondence or copyrighted work.
          </li>
          <li>
            Record, photograph, film or stream inside an experience unless explicitly permitted;
            and never in a way that reveals another member or breaches privacy.
          </li>
          <li>
            Use the platform to arrange anything unlawful, or to circumvent a decision made by
            management.
          </li>
          <li>
            Claim any association with Gillian Anderson or the Office that you do not have, or use
            anything here for publicity.
          </li>
          <li>
            Challenge these terms abusively, or use legal processes to harass the Office or another
            member.
          </li>
        </DocOrderedList>
        <p>
          Breach of this section is the clearest possible ground for immediate suspension or
          closure under section 18, without prejudice to any other remedy available to us.
        </p>
      </DocSection>

      <DocSection spec={S['your-content']} n={13}>
        <p>
          You keep ownership of everything you submit — messages, request details, documents,
          photographs you upload, and your profile content. Without it, we could not run the
          service you asked for.
        </p>
        <p>You grant us a limited licence to:</p>
        <DocList>
          <li>Host, store, reproduce, format and display your content solely to operate the service;</li>
          <li>
            Allow management and authorised staff to read it in the course of administering your
            application, requests, membership and experiences;
          </li>
          <li>
            Create internal notes and records about the arrangements, which remain ours;
          </li>
          <li>
            Disclose it as described in section 12 of the{' '}
            <Link to="/privacy">Privacy Policy</Link> — including where required by law.
          </li>
        </DocList>
        <p>This licence ends when the content is deleted, except for copies retained as required by law or for records already properly created.</p>
        <DocList>
          <li>You confirm you have the right to share what you submit.</li>
          <li>
            Nothing you submit is published publicly, licensed to third parties, or used for
            advertising.
          </li>
          <li>
            You can ask for your content to be removed, subject to records we must keep — see the{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S['our-ip']} n={14}>
        <p>
          The platform software, design, written content, original imagery and documentation are
          owned by or licensed to the Office. The names, trade marks, photographs, likeness, voice
          and material relating to Gillian Anderson are used under licence for the operation of
          this service.
        </p>
        <DocList>
          <li>Your account gives you a personal, non-exclusive, non-transferable, revocable right to use the platform as intended.</li>
          <li>
            You must not copy, modify, redistribute, reverse engineer, sublicense or commercially
            exploit any part of it, except where applicable law expressly permits and cannot be
            waived.
          </li>
          <li>
            No right is granted in any name, image or trade mark beyond the limited use of the
            service itself.
          </li>
          <li>
            Feedback you send may be used to improve the service without obligation to you; we will
            not publish it in a way that identifies you without asking.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S['third-parties']} n={15}>
        <p>
          The platform relies on third-party providers for hosting, database, storage, email and
          optional chat, and may contain links to external services. Those services operate under
          their own terms.
        </p>
        <DocList>
          <li>We are not responsible for the availability, content or practices of external sites.</li>
          <li>
            A link is not an endorsement, and we do not control where you go next — please apply
            your own judgement, and never send payment details to a site reached from a link in a
            message.
          </li>
          <li>
            If a provider change materially affects the service, we will tell you what is changing
            and what it means for you.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.disclaimers} n={16}>
        <p>
          We are direct about this: the service is provided on an{' '}
          <strong className="font-semibold text-[#1E1E1E]">&ldquo;as is&rdquo;</strong> and{' '}
          <strong className="font-semibold text-[#1E1E1E]">&ldquo;as available&rdquo;</strong> basis,
          and, to the extent permitted by law, we give no warranty that it will meet every
          expectation.
        </p>
        <DocList>
          <li>
            We do not warrant uninterrupted, error-free or secure access, or that the platform will
            be free of every defect.
          </li>
          <li>
            We do not warrant that information provided is complete in every respect, though we
            take reasonable care to keep it accurate.
          </li>
          <li>
            No advice or information obtained through the platform creates a warranty not expressly
            stated in these terms.
          </li>
          <li>
            Nothing in these terms excludes warranties or liability that cannot lawfully be
            excluded — including liability for death or personal injury caused by negligence, for
            fraud or fraudulent misrepresentation, and for wilful misconduct.
          </li>
          <li>
            If you are a consumer, mandatory rights and guarantees in your local law apply in
            addition to anything written here, and are not limited by this section.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.liability} n={17}>
        <p>
          This section sets out our financial responsibility to you. It is drafted to be as clear
          as possible rather than to discourage you from raising a genuine claim.
        </p>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">What we are responsible for:</strong>{' '}
            loss that is a foreseeable result of our breach of these terms or our failure to use
            reasonable care and skill.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">What we are not responsible for:</strong>{' '}
            loss that was not foreseeable at the time you accepted these terms; loss caused by
            events outside our reasonable control; loss of profit, business, opportunity or
            goodwill; and loss suffered by a consumer in the course of a business.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Caps:</strong> where the law permits, our
            total aggregate liability arising out of or in connection with the platform in any
            twelve-month period is limited to the amount you paid to the Office in that period, or
            a modest statutory floor where that is higher than the amount you have paid.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Non-excludable liability is untouched:</strong>{' '}
            nothing here limits liability for death or personal injury caused by negligence, for
            fraud or fraudulent misrepresentation, for wilful misconduct, or for anything else that
            applicable law does not allow to be limited.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Your duty to mitigate:</strong> if
            something goes wrong, tell us promptly and take reasonable steps to limit the loss —
            early notice is usually what makes a good outcome possible.
          </li>
        </DocList>
        <DocNote label="Nothing here asks you to waive rights you cannot waive">
          <p>
            Consumer protections, statutory refund rights and any liability that mandatory law
            preserves continue to apply in full, regardless of anything written above.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.termination} n={18}>
        <DocSub>You can leave</DocSub>
        <DocList>
          <li>Ask us to close your account at any time, by email or from inside the platform.</li>
          <li>We will confirm when it is done, and explain anything we must retain and why.</li>
          <li>
            Outstanding fees for arrangements already made remain payable; nothing here removes
            rights you have already earned.
          </li>
        </DocList>
        <DocSub>We may suspend or close</DocSub>
        <DocList>
          <li>For a material or repeated breach of these terms or the Policies;</li>
          <li>Where there is a credible security risk or suspected fraud;</li>
          <li>Where information provided turns out to be materially false;</li>
          <li>
            Where an arrangement becomes unworkable because of conduct, availability or
            circumstances outside our control;
          </li>
          <li>Where we are required to do so by law;</li>
          <li>After a long period of inactivity, having tried to reach you first.</li>
        </DocList>
        <p>
          Where the situation allows, we will tell you what has happened, why, and what can be done
          about it. Immediate action is reserved for cases where delay would cause harm — including
          harm to other members, to staff, or to Gillian.
        </p>
        <p>
          Consequences of closure: access ends immediately; your content is handled under the
          <Link to="/privacy"> Privacy Policy</Link>; and provisions that by their nature should
          survive (including ownership, payment obligations, disclaimers, liability and dispute
          provisions) continue to apply.
        </p>
      </DocSection>

      <DocSection spec={S.changes} n={19}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">To the platform:</strong> features may
            be added, changed or withdrawn. If a change materially reduces what you paid for, we
            will tell you and offer the fairest available alternative.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">To these terms:</strong> material changes
            are notified in advance by email, by notice inside the platform, or both, with
            reasonable time to read them. The date at the top of this page is when the current
            wording took effect.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Fresh consent:</strong> where a change
            requires it (for example a new acknowledgement), we will ask explicitly rather than
            treat continued use as agreement.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">If you disagree:</strong> you may close
            your account before the change takes effect. Continuing to use the platform after the
            effective date means you accept the updated terms.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Minor changes</strong> that do not affect
            your rights (clarifications, typography, new integrations of equivalent kind) may be
            made without notice.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.law} n={20}>
        <p>
          These terms are governed by the law of the jurisdiction in which the Office principally
          operates, and the courts of that jurisdiction have exclusive jurisdiction — except where
          mandatory law gives you the right to bring proceedings in your own country of residence
          as a consumer. We will confirm the governing jurisdiction in writing on request.
        </p>
        <DocSub>Before anything formal</DocSub>
        <DocOrderedList>
          <li>
            Write to us at{' '}
            <a {...mailProps('Terms or dispute query')}>{LEGAL_CONTACT}</a> with the subject
            &ldquo;Dispute&rdquo;, describing what happened and what you would like to happen.
          </li>
          <li>
            We will acknowledge, investigate and reply with a considered position within a
            reasonable time.
          </li>
          <li>
            If we cannot resolve it between us, and where local law provides for it, we are open to
            good-faith mediation or an alternative dispute resolution route before either side
            incurs the cost of formal proceedings.
          </li>
          <li>
            Using a complaint or dispute right will never be treated as a reason to alter how we
            deal with you.
          </li>
        </DocOrderedList>
        <p>
          Nothing in this section prevents either party from seeking urgent injunctive relief, or
          from approaching a supervisory authority where a data protection matter is involved.
        </p>
      </DocSection>

      <DocSection spec={S.contact} n={21}>
        <DocFacts
          rows={[
            [
              'General and account enquiries',
              'Inside the platform — fastest, and attached to your record.',
            ],
            [
              'Legal notices and disputes',
              <a {...mailProps('Legal notice')}>{LEGAL_CONTACT}</a>,
            ],
            [
              'Privacy requests',
              <a {...mailProps('Privacy request')}>{LEGAL_CONTACT}</a>,
            ],
            [
              'The documents that apply',
              <span>
                <Link to="/privacy" className="underline">Privacy Policy</Link>
                {' · '}
                <Link to="/policies" className="underline">Policies</Link>
                {' · '}
                <Link to="/legal" className="underline">Legal notice</Link>
              </span>,
            ],
          ]}
        />
        <p className="pt-2">
          Thank you for reading this far. It matters to us that the rules of this place are clear
          before you rely on them — and easier still, that they are mostly about treating people
          well.
        </p>
      </DocSection>
    </LegalShell>
  );
}
