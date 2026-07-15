/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Modal from './Modal';
import { Shield, Scale, Heart, Coins, Info, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfServiceModal({ isOpen, onClose }: LegalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" maxWidth="max-w-3xl">
      <div className="space-y-6 text-xs text-neutral-300 leading-relaxed text-left">
        <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
          <Scale className="h-5 w-5 text-gold-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">Platform Terms of Use</h4>
            <p className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">Last Revised: July 15, 2026 • Version 2.4</p>
          </div>
        </div>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">1. Agreement to Terms</h5>
          <p>
            Welcome to the Gillian Anderson Official Fan Platform & Sanctuary Bridge (referred to as the "Platform"). This Platform is administered on a non-profit, co-operative basis in solidarity with Gillian Anderson's humanitarian causes. By accessing, registering, or interacting with the Platform (including any features, forums, rewards, or stores), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">2. Co-operative Code of Conduct</h5>
          <p>
            The heart of this platform is a sanctuary for positive fan connection and social action. We operate under a strict zero-tolerance policy for harassment, hate speech, spam, or hostile behavior. As a member, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
            <li>Communicate with kindness, mutual support, and respect across all public and private channels.</li>
            <li>Protect the privacy of youth and mentors involved in the SAYes Mentoring initiatives.</li>
            <li>Avoid disseminating speculative, intrusive, or private information regarding Gillian Anderson or other members.</li>
            <li>Represent your identity truthfully during the registration and verification processes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">3. Loyalty Rewards Program</h5>
          <p>
            The Platform offers a Loyalty Points (PTS) program designed to reward positive engagement, direct humanitarian donations, and community kindness logs.
          </p>
          <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-lg space-y-1">
            <span className="font-mono font-bold text-[9px] text-gold-500 uppercase tracking-wider block">Important Disclaimer</span>
            <p className="text-[11px] text-neutral-400">
              Loyalty Points and Badges are purely virtual indicators of your activity and contributions. They have no monetary cash value, cannot be redeemed for fiat currency, are non-transferable, and do not constitute legal property. Points may be revoked if a member violates the platform's Code of Conduct.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">4. Merchandise & Conclaves Store</h5>
          <p>
            All physical items, limited catalogs, and conclave tickets sold through the Platform are subject to co-operative procurement guidelines. Since all net proceeds are directly assigned to designated charity causes (including youth mentoring transition programs), refund and exchange guidelines are strictly limited.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-400">
            <li>Orders are processed within 3-5 business days and shipped with secure tracking details.</li>
            <li>Refunds are issued solely in the case of damaged or lost packages upon verified carrier inspection.</li>
            <li>You are responsible for providing correct shipping coordinates; re-delivery costs for incorrect addresses will be charged.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">5. Intellectual Property</h5>
          <p>
            All design systems, editorial journal posts, logos, and digital assets on the Platform are owned by or licensed to Gillian Anderson Official. You are granted a limited, personal, non-commercial license to access the content. Mirroring, scraping, or commercializing Platform material without written consent is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">6. Limitation of Liability</h5>
          <p>
            The Platform and all its features are provided "as is" and "as available" without warranties of any kind. Under no circumstances shall the administrators or associates be liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the Platform.
          </p>
        </section>

        <div className="pt-4 border-t border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>CO-OP GOVERNANCE BRIDGE</span>
          <span className="text-gold-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED COMPLIANCE
          </span>
        </div>
      </div>
    </Modal>
  );
}

export function PrivacyPolicyModal({ isOpen, onClose }: LegalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" maxWidth="max-w-3xl">
      <div className="space-y-6 text-xs text-neutral-300 leading-relaxed text-left">
        <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
          <Shield className="h-5 w-5 text-gold-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">Data Privacy Shield</h4>
            <p className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">Last Revised: July 15, 2026 • GDPR & POPIA Compliant</p>
          </div>
        </div>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">Our Privacy Philosophy</h5>
          <p>
            We believe in complete transparency and maximum security. Your data belongs to you. In keeping with Gillian's personal philosophy of private, direct support, our platform does not sell, trade, or monetize your personal information to third-party advertisers or brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">1. Data We Collect</h5>
          <p>
            To deliver an authentic, functional fan sanctuary and dashboard, we collect only the minimum necessary information:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
            <li><strong className="text-neutral-200">Account Credentials:</strong> Your name, email address, and country for registration, event ticketing, and security verification.</li>
            <li><strong className="text-neutral-200">Biographical Information:</strong> Optional member profile biography, favorite film quotes, and general social contact channels if provided voluntarily by you.</li>
            <li><strong className="text-neutral-200">Action History:</strong> Logs of your positive achievements, submitted proposals/requests, event registrations, and physical orders.</li>
            <li><strong className="text-neutral-200">Voluntary Content:</strong> Your shared Kindness Journal logs and trivia answers to calculate loyalty rewards points.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">2. How We Use Your Data</h5>
          <p>
            We process your information exclusively to support your active portal membership:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-400">
            <li>To compile and update your real-time co-op loyalty rank and progress.</li>
            <li>To dispatch exclusive event invitations, digital coordinates, and conclave tickets.</li>
            <li>To manage, package, and ship physical goods requested via the loyalty catalog or checkouts.</li>
            <li>To allow safe communication and messages between verified platform members.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">3. Data Security & Storage</h5>
          <p>
            Your information is stored in highly secure, containerized environments utilizing industry-standard encryption protocols. We use standard browser local storage purely to maintain your active login state and local settings. Payment processing utilizes end-to-end tokenized gateways—no card numbers or banking secrets are ever stored on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">4. Your Access and Rights</h5>
          <p>
            You have full control over your private information. You can review, update, or completely erase your bio, favorite movie choices, and profile details directly from the Profile & Settings tab of the portal at any time. To completely terminate your membership and purge all related records, you may submit a request to the co-op administration team.
          </p>
        </section>

        <div className="pt-4 border-t border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>SAFE SANCTUARY PROTOCOL</span>
          <span className="text-gold-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> 100% PRIVATE & ENCRYPTED
          </span>
        </div>
      </div>
    </Modal>
  );
}

export function CharityDisclosuresModal({ isOpen, onClose }: LegalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Charity Disclosures" maxWidth="max-w-3xl">
      <div className="space-y-6 text-xs text-neutral-300 leading-relaxed text-left">
        <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
          <Heart className="h-5 w-5 text-gold-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif">Humanitarian Disclosures</h4>
            <p className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">Financial Transparency • Non-Profit Operations</p>
          </div>
        </div>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">Co-operative Solidarity Mission</h5>
          <p>
            The Gillian Anderson Fan Platform operates under a unified ethical co-op model. We are dedicated to translating online engagement and fan interactions into direct, measurable, and highly audit-compliant real-world resources for vulnerable youth and women's advocacy circles.
          </p>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">1. Official Charity Partner Spotlight</h5>
          <p>
            We are proud to support and verify the following official non-governmental organisations (NGOs):
          </p>
          
          <div className="grid gap-3 sm:grid-cols-2 mt-2">
            <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
              <span className="font-mono text-[9px] text-gold-500 font-bold uppercase tracking-wider block">SAYes Mentoring</span>
              <p className="text-[11px] text-neutral-400 mt-1">
                A registered non-profit organization focused on empowering youth in South Africa as they transition out of state care. Structured mentorship helps secure education, jobs, housing, and social well-being.
              </p>
              <div className="mt-2 text-[9px] font-mono text-neutral-500">
                UK Registered Charity: 1124409<br />
                South Africa NPO Registry: 073-455-NPO
              </div>
            </div>

            <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
              <span className="font-mono text-[9px] text-gold-500 font-bold uppercase tracking-wider block">We Manifesto Circles</span>
              <p className="text-[11px] text-neutral-400 mt-1">
                Sponsors regional counseling panels, high-impact reading material libraries, and psychological self-worth circles focusing on female leadership and youth empowerment.
              </p>
              <div className="mt-2 text-[9px] font-mono text-neutral-500">
                Focus Areas: UK & South Africa youth clinics
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">2. Direct Allocation of Funds</h5>
          <p>
            We operate with clear financial divisions. Every donation, store order checkout, and membership support contribution is strictly routed:
          </p>

          <div className="relative w-full rounded-xl border border-neutral-900 overflow-hidden bg-neutral-900/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 text-center border-b border-neutral-900 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900">
              <div className="p-4 bg-gold-500/5">
                <span className="text-2xl font-bold font-mono text-gold-500 block">85%</span>
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mt-1">Direct Cause Funding</span>
                <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                  Goes directly to paying mentor training materials, educational kits, mental wellness grants, and program resources.
                </p>
              </div>
              <div className="p-4">
                <span className="text-2xl font-bold font-mono text-neutral-400 block">15%</span>
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mt-1">Co-op Infrastructure</span>
                <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                  Covers web server infrastructure, package storage/fulfillment, international custom coordinates, and basic support overhead.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h5 className="font-mono text-[10px] text-gold-500 font-bold uppercase tracking-widest">3. Transparent Auditing</h5>
          <p>
            Every single donation and store checkout is processed under strict double-entry ledger verification. Financial statements, allocation details, and direct transfer slips are regularly cross-examined. Platform members can review high-level reports on total funds raised within the Portal's Dashboard tab.
          </p>
        </section>

        <div className="pt-4 border-t border-neutral-900 flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>TRANSPARENT HUMANITARIAN STANDARD</span>
          <span className="text-gold-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED CHARITY AUDIT
          </span>
        </div>
      </div>
    </Modal>
  );
}
