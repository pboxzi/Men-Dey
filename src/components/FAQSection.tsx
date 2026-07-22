import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Award,
  Sparkles,
  BookOpen,
  MessageSquare
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA_FALLBACK: FAQItem[] = [
  {
    id: 'faq-what-is',
    question: "What is the Gillian Anderson Co-op Community?",
    answer: "The Co-op Community is an official fan cooperative and mentorship platform created by Gillian Anderson. It brings fans together through shared interests, exclusive events, and collaborative projects. Members can access private conclaves, group chats, journal entries, and contribute to community-driven initiatives — all in a safe, moderated space.",
    category: "community"
  },
  {
    id: 'faq-membership',
    question: "What membership tiers are available and what do they include?",
    answer: "We offer three tiers: Community (free) gives you access to the public forum, journal entries, and event announcements. Co-op Member (annual subscription) unlocks exclusive conclaves, private live-streamed events, priority booking for experiences, and the ability to earn and redeem community points. Patron tier adds direct access to Gillian's Ask Gillian chat, exclusive merchandise, and VIP event invitations.",
    category: "membership"
  },
  {
    id: 'faq-events',
    question: "How do I register for Co-op Conclaves and events?",
    answer: "Browse upcoming events in the Events section and click 'Register Now'. You'll need a Co-op account to register. After registration, you'll receive a confirmation with your ticket reference. Events include live-streamed Q&As, panel screenings, fundraising galas, and intimate group chats with Gillian. Priority registration is given to Co-op Members and Patrons.",
    category: "events"
  },
  {
    id: 'faq-experiences',
    question: "What are Experiences and how can I book one?",
    answer: "Experiences are curated one-on-one or small group sessions with Gillian — including virtual coffee chats, signed book consultations, script readings, and personalized video messages. Browse available experiences, select a time slot, and complete your booking through the portal. Co-op Members receive priority scheduling and discounted rates.",
    category: "experiences"
  },
  {
    id: 'faq-portal',
    question: "How do I access and use the Fan Portal?",
    answer: "Click 'ENTER YOUR PORTAL' or 'SIGN IN' on the site header to access the Fan Portal. From there you can manage your profile, view your membership dashboard, track community points, book experiences, register for events, chat with other fans, and access your Ask Gillian conversations. The portal is your central hub for all community activity.",
    category: "portal"
  },
  {
    id: 'faq-points',
    question: "How do community points work and what can I redeem them for?",
    answer: "You earn points by participating in community activities: posting in forums, commenting on journal entries, registering for events, attending conclaves, and referring friends. Points unlock badge levels (Newcomer → Regular → Contributor → VIP → Legend) and can be redeemed for exclusive merchandise, priority event access, and special experiences. Your current tier and points are shown in your membership dashboard.",
    category: "community"
  },
  {
    id: 'faq-ask-gillian',
    question: "What is Ask Gillian and how do I get a response?",
    answer: "Ask Gillian is a private chat feature where Co-op Members and Patrons can send messages directly to Gillian. She personally reviews and responds to select messages during dedicated response windows. Messages should be thoughtful and respectful — keep them concise. Response times vary, but Patrons receive priority. All conversations are private and stored securely in your portal.",
    category: "membership"
  },
  {
    id: 'faq-safety',
    question: "How does the community ensure a safe and respectful environment?",
    answer: "All community interactions are moderated by our admin team. We enforce a strict code of conduct: no harassment, hate speech, spam, or inappropriate content. Users can report posts, and moderators review all flagged content within 24 hours. Repeat violations result in warnings, temporary suspension, or permanent removal. Your safety and comfort are our top priority.",
    category: "community"
  },
  {
    id: 'faq-contact',
    question: "How can I contact the admin team for support?",
    answer: "You can reach the admin team through the Contact page, via the Fan Portal messaging system, or by emailing support through the official contact form. For urgent matters related to your account, membership, or event registration, use the portal's direct messaging for the fastest response. Admin response times are typically within 24-48 hours.",
    category: "portal"
  },
  {
    id: 'faq-advocacy',
    question: "How does the community support Gillian's advocacy work?",
    answer: "A portion of all Co-op membership fees and event proceeds goes directly to Gillian's chosen charities, including SA-YES (South African Youth Education for AIDS) and the Children's Tumor Foundation. Community fundraising galas and exclusive charity events are organized regularly. Members can also volunteer for advocacy campaigns and earn special badges for their contributions.",
    category: "advocacy"
  }
];

export default function FAQSection() {
  const { content } = useGlobalState();
  const FAQ_DATA = content.faqEntries.length > 0 ? content.faqEntries : FAQ_DATA_FALLBACK;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'community' | 'membership' | 'events' | 'experiences' | 'portal' | 'advocacy'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-what-is');
  
  // Interactive "helpful" counts stored locally
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'yes' | 'no' | null>>({});

  const categories = [
    { value: 'all', label: 'ALL QUESTIONS' },
    { value: 'community', label: 'COMMUNITY' },
    { value: 'membership', label: 'MEMBERSHIP' },
    { value: 'events', label: 'EVENTS' },
    { value: 'experiences', label: 'EXPERIENCES' },
    { value: 'portal', label: 'PORTAL' },
    { value: 'advocacy', label: 'ADVOCACY' }
  ];

  const handleVote = (id: string, voteType: 'yes' | 'no') => {
    setHelpfulVotes(prev => ({
      ...prev,
      [id]: prev[id] === voteType ? null : voteType
    }));
  };

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'community':
        return <Award className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'membership':
        return <Sparkles className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'events':
        return <BookOpen className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'experiences':
        return <MessageSquare className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'portal':
        return <HelpCircle className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'advocacy':
        return <Award className="h-3.5 w-3.5 text-gold-500/80" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-gold-500/80" />;
    }
  };

  return (
    <section id="FAQ" className="py-24 bg-[#050505] border-t border-neutral-900/60 relative overflow-hidden">
      {/* Visual Architectural Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 right-10 h-72 w-72 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 h-72 w-72 rounded-full bg-amber-500/3 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 md:px-6 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[9px] font-mono tracking-widest uppercase font-bold">
            <HelpCircle className="h-3.5 w-3.5 animate-pulse" />
            COMMUNITY KNOWLEDGEBASE
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-amber-300">Questions</span>
          </h2>
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto" />
          <p className="text-xs text-neutral-400 max-w-xl mx-auto font-sans leading-relaxed">
            Everything you need to know about the Co-op Community, membership tiers, events, experiences, and more.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search common questions and answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950/80 text-xs border border-neutral-900 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-gold-500/50 transition-colors placeholder:text-neutral-600 shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 hover:text-white uppercase"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Capsules */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value as any)}
                className={`px-3 py-1.5 text-[9px] font-bold tracking-widest transition-all rounded-lg uppercase min-h-[32px] ${
                  activeCategory === cat.value
                    ? 'text-gold-500 bg-gold-500/10 border border-gold-500/30'
                    : 'text-neutral-400 hover:text-white bg-neutral-950/60 border border-transparent hover:border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion UI */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                const userVote = helpfulVotes[faq.id] || null;

                return (
                  <motion.div
                    key={faq.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-2xl border transition-all duration-300 ${
                      isExpanded
                        ? 'border-gold-500/30 bg-neutral-950/90 shadow-[0_4px_24px_-10px_rgba(212,163,89,0.1)]'
                        : 'border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 hover:bg-neutral-950/60'
                    }`}
                  >
                    {/* Header/Trigger */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 select-none min-h-[64px]"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                          {getCategoryIcon(faq.category)}
                        </span>
                        <span className="font-serif text-sm md:text-base font-bold text-white tracking-wide group-hover:text-gold-500 transition-colors">
                          {faq.question}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-neutral-500 shrink-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    {/* Expandable Content Panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-neutral-900/60 space-y-4">
                            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                              {faq.answer}
                            </p>

                            {/* Helpful interaction widget */}
                            <div className="flex items-center justify-between pt-4 border-t border-neutral-900/30">
                              <span className="text-[10px] font-mono text-neutral-500 tracking-wider">
                                Was this answer helpful to you?
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleVote(faq.id, 'yes')}
                                  className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-widest flex items-center gap-1.5 transition-all active:scale-95 min-h-[32px] ${
                                    userVote === 'yes'
                                      ? 'bg-gold-500/15 border-gold-500/40 text-gold-500'
                                      : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                                  }`}
                                  aria-label="Vote helpful"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>YES</span>
                                </button>
                                <button
                                  onClick={() => handleVote(faq.id, 'no')}
                                  className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-widest flex items-center gap-1.5 transition-all active:scale-95 min-h-[32px] ${
                                    userVote === 'no'
                                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                      : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                                  }`}
                                  aria-label="Vote not helpful"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                  <span>NO</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border border-dashed border-neutral-900 rounded-2xl"
              >
                <p className="text-xs text-neutral-500 font-mono tracking-wider">
                  No matching questions found in this category.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-3 text-[10px] font-bold text-gold-500 hover:underline tracking-widest uppercase"
                >
                  Reset all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
