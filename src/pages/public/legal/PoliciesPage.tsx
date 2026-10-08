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
  {id: 'how', title: 'How these policies work'},
  {id: 'conduct', title: 'Kind communication and conduct'},
  {id: 'discretion', title: 'Discretion and member privacy'},
  {id: 'content', title: 'Content, copyright and sharing'},
  {id: 'media', title: 'Photography, recording and press'},
  {id: 'billing', title: 'Membership, billing and refunds'},
  {id: 'booking', title: 'Booking, rescheduling and cancellation'},
  {id: 'payments', title: 'Payments and fraud safety'},
  {id: 'accounts', title: 'Accounts and access'},
  {id: 'records', title: 'Documents and records'},
  {id: 'cookies', title: 'Cookies and device storage'},
  {id: 'accessibility', title: 'Accessibility and inclusion'},
  {id: 'safety', title: 'Safety and safeguarding'},
  {id: 'reporting', title: 'Reporting and complaints'},
  {id: 'enforcement', title: 'Enforcement'},
  {id: 'changes', title: 'Changes to these policies'},
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
 * Policies — the operational rules behind the Terms: conduct, discretion,
 * content, billing, bookings, safety, accessibility, reporting and how
 * breaches are actually handled.
 */
export function PoliciesPage() {
  return (
    <LegalShell
      eyebrow="Policies"
      title="How we keep this place considered."
      toc={TOC}
      lede={
        <>
          <p>
            The <Link to="/terms">Terms of Service</Link> set the agreement. These policies are the
            operational detail: how people are expected to behave, how membership and money are
            handled, how experiences are scheduled and changed, what happens when something goes
            wrong, and how we deal with a breach fairly.
          </p>
          <p className="mt-4">
            Every rule here exists because the alternative — ambiguity — is worse for everyone,
            including you.
          </p>
        </>
      }
    >
      <DocSection spec={S.how} n={1}>
        <DocList>
          <li>
            These policies sit alongside the <Link to="/terms">Terms of Service</Link> and the{' '}
            <Link to="/privacy">Privacy Policy</Link>. Where they overlap, the Terms prevail on the
            legal relationship and the Privacy Policy prevails on personal data.
          </li>
          <li>
            They apply to everyone using the platform: applicants, members, guests named by
            management, and staff.
          </li>
          <li>
            A specific offer, proposal or agreement may set different terms for that arrangement.
            When it does, the specific terms apply to that arrangement only, and these policies
            fill in anything they do not cover.
          </li>
          <li>
            We would rather explain than punish. If a rule seems unclear, ask — clarification is
            never held against anyone.
          </li>
        </DocList>
        <DocTable
          head={['Document', 'Use it to understand']}
          rows={[
            ['Terms of Service', 'Your legal agreement with the Office: eligibility, accounts, liability, termination, governing law.'],
            ['Privacy Policy', 'Your data: what is collected, why, who sees it, how long it is kept, and your rights.'],
            ['Policies (this page)', 'Day-to-day rules: conduct, discretion, content, billing, bookings, safety, reporting and enforcement.'],
            ['Legal notice', 'Who is behind the platform and how to reach a person.'],
          ]}
        />
      </DocSection>

      <DocSection spec={S.conduct} n={2}>
        <p>
          Communication here passes through a small management team and, ultimately, concerns a
          private individual. The tone we ask for follows from that.
        </p>
        <DocSub>What we ask of you</DocSub>
        <DocList>
          <li>Be warm but professional. Familiarity is welcome; entitlement is not.</li>
          <li>
            Accept &ldquo;no&rdquo; — to a request, a date, a change, a boundary — the first time it
            is said. Repeated asking after a decline is treated as a conduct matter.
          </li>
          <li>
            Keep disagreement about the matter at hand. No personal remarks about staff, other
            members or Gillian.
          </li>
          <li>
            Allow for timing. Response times vary with workload and commitments; silence is not
            disrespect, and chasing does not speed it up.
          </li>
          <li>
            Do not use messages, requests or documents as a channel for personal grievance, legal
            threat or negotiation by attrition. Use the reporting route in section 14.
          </li>
          <li>
            Understand that what feels like enthusiasm to one person can feel like pressure to
            another. Give people room.
          </li>
        </DocList>
        <DocSub>What will end a conversation</DocSub>
        <DocList>
          <li>Abuse, threats, insults, or demeaning language toward anyone here.</li>
          <li>Sexualised, exploitative or harassing content of any kind.</li>
          <li>Persistent contact across channels after being asked to stop.</li>
          <li>Attempts to intimidate, blackmail or coerce a decision.</li>
          <li>Racism, discrimination, or hostility toward anyone on a protected characteristic.</li>
        </DocList>
        <DocNote label="Applies to everyone equally">
          <p>
            The same standard is expected of staff. If a member of the team is discourteous or
            inappropriate, tell us — see section 14. Seniority inside the office does not change
            the standard.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.discretion} n={3}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Membership and access are curated.</strong>{' '}
            Applications are reviewed individually, decisions are at management&rsquo;s discretion,
            and we are not obliged to give reasons for a decline.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">There is no public membership list.</strong>{' '}
            Members are not visible to one another, there is no directory, no member search and no
            way to see who else is here.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Membership does not buy influence.</strong>{' '}
            Tier, spend and tenure do not change how a request is judged on its merits, nor do they
            guarantee time with Gillian.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">No queue-jumping.</strong> Requests are
            considered in the order and context that makes sense for them, not by who joined first
            or who pays most.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Confidentiality runs both ways.</strong>{' '}
            Management does not disclose a member&rsquo;s presence, details or arrangements — not to
            other members, not publicly, not to press. Please extend the same discretion to what you
            learn here.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.content} n={4}>
        <DocList>
          <li>
            You keep ownership of what you post. You grant the limited licence described in section
            13 of the <Link to="/terms">Terms of Service</Link> so the service can function.
          </li>
          <li>
            Submit only material you have the right to share. Do not upload copyrighted work,
            confidential documents belonging to others, or private photographs of anyone who has not
            consented.
          </li>
          <li>
            Nothing here may be republished — no screenshots of messages, offers, documents or any
            part of a member area, in whole or in part, in any public place, including private
            social accounts where others can see them.
          </li>
          <li>
            The name, images, likeness, voice and material relating to Gillian Anderson may not be
            used for promotion, merchandise, commentary for commercial purposes, or training data
            for machine-learning systems.
          </li>
          <li>
            If you want to reference the platform in something you publish, ask first — we usually
            say yes to reasonable, non-commercial, non-disclosing mentions.
          </li>
          <li>
            On being asked to remove material that infringes someone&rsquo;s rights, we will act
            promptly. Report it through section 14.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.media} n={5}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Recording needs explicit permission.</strong>{' '}
            Photography, audio recording, filming and streaming during an experience are permitted
            only where management has confirmed them in writing, and only on the terms stated.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Nothing may identify another person.</strong>{' '}
            Even when you may record, other members, staff, locations and private moments must not
            be identifiable.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Devices stay private.</strong> Phones and
            cameras may be asked to stay away at any point; instructions from staff on the ground
            are not negotiable in the moment — raise concerns afterwards through section 14.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">No press, no credentials, no broadcast.</strong>{' '}
            Approaching press, creators or media about anything connected to the platform or an
            experience, without written approval, is a serious breach.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Do not pursue.</strong> Photographing,
            following or approaching Gillian or any member outside an arranged experience is
            prohibited, and will end participation immediately.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.billing} n={6}>
        <DocSub>Offers and acceptance</DocSub>
        <DocList>
          <li>Membership begins only with an offer you accept and any required payment confirmed.</li>
          <li>Each offer states its price, benefits, billing period, validity and any specific terms.</li>
          <li>
            An offer lapses at its validity date if not accepted. Lapsed offers can be re-requested
            but may be reissued on different terms.
          </li>
          <li>
            Benefits start on activation, not on acceptance or payment alone, and are personal to
            you.
          </li>
        </DocList>
        <DocSub>Billing</DocSub>
        <DocList>
          <li>
            Charges are billed as stated in your offer — for a fixed term or, only where the offer
            says so, on a recurring basis with a reminder before each renewal.
          </li>
          <li>
            Payment is due by the date in the offer or payment request. Activation can follow
            confirmation of payment.
          </li>
          <li>
            Membership fees are non-transferable and non-exchangeable for cash, and benefits cannot
            be split, gifted or shared.
          </li>
          <li>
            Late or failed payment may pause benefits until it is resolved; we will tell you before
            that happens wherever we can.
          </li>
        </DocList>
        <DocSub>Cancellation, refunds and price changes</DocSub>
        <DocList>
          <li>
            You may end a membership at any time; benefits continue to the end of the period already
            paid for unless you ask otherwise and we agree.
          </li>
          <li>
            Unless an offer or mandatory consumer law says otherwise, fees for a period already
            begun are non-refundable, because the benefit is access to a curated service rather
            than a physical good.
          </li>
          <li>
            Where we end your membership for reasons not caused by you, we refund fees reasonably
            attributable to the unused portion of the period.
          </li>
          <li>
            Where a benefit proves materially different from how it was described, tell us and we
            will put it right — by remedy, adjustment or refund as appropriate.
          </li>
          <li>
            Price changes are notified in advance; if you are on a fixed term, your price holds until
            the end of that term.
          </li>
          <li>
            Statutory cancellation and refund rights for consumers are unaffected by anything here.
          </li>
        </DocList>
        <DocNote label="Fees and the price of attention">
          <p>
            No fee paid on this platform purchases a guaranteed outcome, a guaranteed reply, or
            guaranteed time with Gillian. Fees secure membership benefits and the arrangements they
            describe — nothing else.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.booking} n={7}>
        <p>
          Experiences run through four stages — interest, proposal, your acceptance, management
          confirmation — as set out in section 8 of the <Link to="/terms">Terms of Service</Link>.
          This policy covers what happens around them.
        </p>
        <DocTable
          head={['Situation', 'How it is handled']}
          rows={[
            [
              'You need to change plans',
              'Tell us as early as possible. Reasonable notice usually allows a reschedule or a substitute arrangement; notice given late may not.',
            ],
            [
              'Management needs to change or cancel',
              'We will inform you as soon as we know, and offer the fairest available remedy — a reschedule, an alternative, or a refund of amounts paid for the affected arrangement.',
            ],
            [
              'Late arrival',
              'Time lost to a late arrival is rarely recoverable. If you are running behind, tell us while there is still time to do something about it.',
            ],
            [
              'Non-attendance or no-show',
              'The arrangement is treated as consumed; fees already paid are not refunded, and the opportunity cannot be re-offered to you later.',
            ],
            [
              'Cancellation by you',
              'Handled on the notice periods stated in your proposal. Where no period is stated, deposits and amounts already committed to third parties are not recoverable and the balance is assessed fairly.',
            ],
            [
              'Events outside reasonable control',
              'Neither side is at fault. We will offer the fairest available remedy taking account of what has already been incurred on your behalf.',
            ],
            [
              'Conduct that makes an experience unworkable',
              'It may be ended immediately under section 15, with fees for the affected arrangement non-refundable unless the conduct was provoked by us.',
            ],
          ]}
        />
        <DocList>
          <li>Confirmations, changes and cancellations are only valid when made inside the platform.</li>
          <li>An experience arranged elsewhere — by message, call or in person — is not a booking.</li>
          <li>
            Please do not ask staff to hold dates informally; an unconfirmed hold protects nobody.
          </li>
          <li>
            Accessibility needs, dietary requirements or anything that affects how an experience
            should run should be told to us as early as possible — see section 12.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.payments} n={8}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">The platform never asks for card
            details.</strong> There is no card form here. Payment instructions come from management
            inside the platform and name the method being used.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">We will never ask for a secret.</strong>{' '}
            Not a card number, security code, bank login, one-time code or password — not in
            messages, documents, email or chat, and not by phone. Anyone who asks is not us.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Verify anything unexpected.</strong> If
            you receive a payment request that surprises you, check it inside the platform or reply
            to a known address before acting on it.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Records are manual.</strong> Management
            records payments as confirmed, so allow for processing time and keep your own
            confirmation from your provider.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Report fraud immediately</strong> to{' '}
            <a {...mailProps('Fraud or suspicious payment request')}>{LEGAL_CONTACT}</a> and, if you
            have already sent money to a suspicious party, to your bank as well. Speed matters most.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Disputed payments</strong> are paused
            while we check them together; we will always prefer conversation to chargebacks, but we
            will not penalise you for using a protection your law gives you.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.accounts} n={9}>
        <DocList>
          <li>
            Accounts are personal, non-transferable and non-shareable — including with family, staff
            or colleagues. If someone else needs to act for you, tell us and we will find a proper
            arrangement.
          </li>
          <li>One person, one account. Duplicate accounts created to circumvent a decision will be closed.</li>
          <li>
            Keep your sign-in details private and unique to this platform, and tell us promptly if
            you think your account has been used by someone else.
          </li>
          <li>
            Do not let anyone else use your account to communicate with management; statements made
            through it are treated as yours.
          </li>
          <li>
            Access may be limited while a security or conduct question is investigated, with an
            explanation wherever the situation allows.
          </li>
          <li>
            Long-inactive accounts may be closed after we try to reach you. Any records we must keep
            are handled under the <Link to="/privacy">Privacy Policy</Link>.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.records} n={10}>
        <DocList>
          <li>
            Documents you upload belong to you; visibility is recorded on each file — private to
            you, shared with management, or management&rsquo;s own.
          </li>
          <li>
            Please send only what is needed. A document we do not need is one more thing that has to
            be protected.
          </li>
          <li>
            Keep files free of other people&rsquo;s personal data unless you have their permission
            or a lawful reason to share it.
          </li>
          <li>
            Agreements, acknowledgements and payment records are retained as set out in section 14
            of the <Link to="/privacy">Privacy Policy</Link>, even after you ask for deletion,
            where the law requires it.
          </li>
          <li>
            You may request a copy of what we hold about you, or ask for a document you uploaded to
            be removed, through the rights process in the Privacy Policy.
          </li>
          <li>
            Material that is unlawful, infringing or unrelated to an arrangement may be removed,
            with notice where the situation allows.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.cookies} n={11}>
        <p>
          This is a short policy because the platform is deliberately restrained: no advertising
          cookies, no cross-site tracking, no third-party analytics. The full list of what is stored
          on your device, and for how long, is in section 10 of the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <DocList>
          <li>
            Strictly necessary storage keeps you signed in and keeps your application draft safe
            between steps; without it, the service does not work.
          </li>
          <li>
            The service worker caches versioned static assets so the app opens quickly, and refreshes
            itself automatically on every release.
          </li>
          <li>
            The optional live chat on the welcome page loads only when you use it, and is never
            loaded inside your account.
          </li>
          <li>
            You can clear or block site data in your browser at any time; blocking it entirely will
            sign you out and stop the application draft from saving.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.accessibility} n={12}>
        <DocList>
          <li>
            We aim for a service usable with a keyboard alone, with a screen reader, at enlarged
            text sizes, in reduced-motion mode, and in conditions of low vision or colour contrast.
          </li>
          <li>
            Tell us what is getting in the way — an element you cannot reach, text you cannot read,
            a flow that assumes something you cannot do. Accessibility feedback is treated as a bug,
            not a preference.
          </li>
          <li>
            We will provide any document or communication in plain text, larger type or another
            reasonable format on request, at no cost.
          </li>
          <li>
            If an experience involves a venue or activity with physical, sensory or other
            requirements, tell us what you need as early as possible so it can be checked before you
            commit.
          </li>
          <li>
            Reasonable adjustments are made without requiring you to disclose a diagnosis; we ask
            only what is necessary to make the change.
          </li>
          <li>
            Requests go to{' '}
            <a {...mailProps('Accessibility request')}>{LEGAL_CONTACT}</a> and are handled
            promptly.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.safety} n={13}>
        <DocList>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Management arranges everything.</strong>{' '}
            Meetings, locations and timings come through the platform. Please do not act on
            arrangements communicated any other way.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Verify the unexpected.</strong> If you
            are contacted by someone claiming to act for Gillian or the Office outside this
            platform, do not engage — forward it to us for checking.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">In person, instructions are final.</strong>{' '}
            Safety guidance from staff or venue personnel during an experience must be followed,
            even where it changes what you expected.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Consent is ongoing.</strong> It can be
            withdrawn at any point; if someone withdraws it, everything stops, immediately and
            without argument.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Alcohol and substances</strong> that
            impair judgement, safety or respect for others may lead to an experience being ended.
          </li>
          <li>
            <strong className="font-semibold text-[#1E1E1E]">Serious concerns</strong> — threats,
            harassment, exploitation, risk of harm to anyone — are escalated immediately and, where
            required, reported to the authorities. We will tell you if that happens unless we are
            legally prevented.
          </li>
        </DocList>
        <DocNote label="Children">
          <p>
            The platform is for adults aged 18 or over, and no minor may attend an experience
            unless the arrangement expressly says otherwise and every safeguard has been agreed in
            advance in writing.
          </p>
        </DocNote>
      </DocSection>

      <DocSection spec={S.reporting} n={14}>
        <p>
          If something is wrong — a message that crossed a line, a payment request you did not
          expect, an approach from someone claiming to represent us, a decision you believe rests on
          a mistake — we want to hear about it.
        </p>
        <DocOrderedList>
          <li>
            Email{' '}
            <a {...mailProps('Report or complaint')}>{LEGAL_CONTACT}</a> with the subject
            &ldquo;Report&rdquo; or &ldquo;Complaint&rdquo;. Inside the platform is fine too, but
            email keeps a record independent of your account.
          </li>
          <li>
            Tell us what happened, when, and what you would like to happen next. Include links or
            screenshots where they help — and remove anything that identifies a third party
            unnecessarily.
          </li>
          <li>
            We acknowledge promptly, tell you who is handling it, and give a considered response
            within a reasonable time. Urgent safety matters are escalated the same day.
          </li>
          <li>
            If you are not satisfied, reply saying so and it is reviewed by someone more senior than
            the first handler. We will explain our reasoning rather than simply repeat it.
          </li>
          <li>
            Where the matter involves personal data, the rights process in section 16 of the{' '}
            <Link to="/privacy">Privacy Policy</Link> applies alongside this one, and you may
            escalate to your local supervisory authority at any point.
          </li>
        </DocOrderedList>
        <DocList>
          <li>
            Raising a report in good faith is always protected — it is never itself a breach, and
            how we treat you does not depend on whether we agree with you.
          </li>
          <li>
            We do not tolerate retaliation against anyone who raises a concern, whether member or
            staff.
          </li>
          <li>
            Reports are shared only with those who need to handle them, and are kept no longer than
            needed to resolve and learn from the matter.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.enforcement} n={15}>
        <p>
          When something breaches these policies, our aim is to fix it with the least disruption
          that the seriousness of the matter allows. Typical steps, in order:
        </p>
        <DocTable
          head={['Step', 'When it applies', 'Effect']}
          rows={[
            ['Clarification', 'Something looks like a misunderstanding.', 'A conversation; no record of wrongdoing.'],
            ['Warning', 'A first, minor breach.', 'A clear statement of what must change, in writing.'],
            ['Content removal', 'Material that infringes, endangers or identifies someone.', 'The material comes down; the account continues.'],
            ['Feature limitation', 'Repeated low-level breaches, or during an investigation.', 'Specific functions (messaging, requests, uploads) are paused, with an explanation.'],
            ['Suspension', 'Serious breach, or a breach continuing after warning.', 'Access is paused for a stated period while matters are resolved.'],
            ['Closure', 'Severe or repeated breaches, fraud, threats, or conduct risking anyone&rsquo;s safety.', 'The account ends; surviving provisions of the Terms continue to apply.'],
          ]}
        />
        <DocList>
          <li>
            Immediate action without prior warning is reserved for cases where delay would cause
            harm — safety, fraud, security, or serious disruption to others.
          </li>
          <li>
            Where the situation allows, you will be told what happened, which policy was engaged,
            and what can be done about it.
          </li>
          <li>
            Decisions can be appealed through the reporting route in section 14; appeals are read by
            someone who did not make the original decision.
          </li>
          <li>
            Memberships, benefits and arrangements affected by enforcement are handled under the
            billing policy in section 6 — we do not keep money for a benefit we have stopped
            providing, beyond amounts already properly incurred.
          </li>
          <li>
            Staff are subject to the same steps, plus the Office&rsquo;s own internal disciplinary
            process.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.changes} n={16}>
        <DocList>
          <li>We review these policies as the platform evolves and whenever something does not work as well as it should.</li>
          <li>
            Material changes are announced in advance, inside the platform, by email, or both — with
            time to read them before they take effect.
          </li>
          <li>
            The date at the top of this page is when the current wording took effect; earlier
            versions are available on request.
          </li>
          <li>
            Where a change reduces what you are entitled to for an arrangement already agreed, the
            terms in place when you agreed it continue to apply to that arrangement.
          </li>
          <li>
            Continued use after the effective date means you accept the updated policies; if you do
            not, close your account beforehand.
          </li>
        </DocList>
      </DocSection>

      <DocSection spec={S.contact} n={17}>
        <DocFacts
          rows={[
            ['Everyday questions', 'Inside the platform — attached to your record, answered by the team.'],
            ['Report or complaint', <a {...mailProps('Report or complaint')}>{LEGAL_CONTACT}</a>],
            ['Accessibility', <a {...mailProps('Accessibility request')}>{LEGAL_CONTACT}</a>],
            ['Fraud or suspicious request', <a {...mailProps('Fraud or suspicious payment request')}>{LEGAL_CONTACT}</a>],
            [
              'The other documents',
              <span>
                <Link to="/terms" className="underline">Terms of Service</Link>
                {' · '}
                <Link to="/privacy" className="underline">Privacy Policy</Link>
                {' · '}
                <Link to="/legal" className="underline">Legal notice</Link>
              </span>,
            ],
          ]}
        />
      </DocSection>
    </LegalShell>
  );
}
