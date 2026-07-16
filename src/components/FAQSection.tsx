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
    id: 'faq-sayes',
    question: "What is SA-YES and how does Gillian support it?",
    answer: "SA-YES (South African Youth Education for AIDS) was co-founded by Gillian Anderson in 2005. It is a charity dedicated to mentoring marginalized youth transitioning out of children's homes in South Africa, providing them with guidance, resources, and pathways to independent adult lives. 100% of the net proceeds from specific official campaign items and store merchandise support SA-YES programs directly.",
    category: "advocacy"
  },
  {
    id: 'faq-scully',
    question: "What is 'The Scully Effect' and how did it impact society?",
    answer: "The Scully Effect refers to the real-world phenomenon where the character of Special Agent Dana Scully on 'The X-Files' inspired a significant increase in women pursuing degrees and careers in science, technology, engineering, and mathematics (STEM). A 2018 study confirmed that women who watched the show regularly were 50% more likely to work in STEM fields, highlighting the immense power of authentic representation on television.",
    category: "career"
  },
  {
    id: 'faq-want',
    question: "Tell us more about her book 'Want' and the letters within it.",
    answer: "Gillian's groundbreaking book 'Want' is a curated collection of hundreds of anonymous letters submitted by women from all corners of the globe. These letters candidly explore their private desires, relationships, fantasies, and hidden experiences. It creates an intimate, liberating, and judgment-free archive designed to dismantle historic taboos and empower open conversation about feminine sexuality.",
    category: "community"
  },
  {
    id: 'faq-gspot',
    question: "What are 'G-Spot' functional soft drinks and their active ingredients?",
    answer: "G-Spot is Gillian's official range of functional soft drinks, formulated using natural botanicals, adaptogens, and active extracts. The drinks come in four functional blends—Lift (for cognitive focus and mental energy), Soothe (for stress-relief and calm), Purify (for daily body rejuvenation and digestion support), and Arouse (for sensory awakening and elevation). They are crafted without artificial preservatives or refined sugars.",
    category: "g-spot"
  },
  {
    id: 'faq-membership',
    question: "How can I participate in official community experiences and events?",
    answer: "Co-op members and community tier subscribers can apply directly for digital and offline Experiences, private live-streamed conclaves, and interactive group chats with Gillian. All applications are managed through the official digital Fan Portal, where users can also participate in forums, read exclusive journal entries, and track their community contributions.",
    category: "community"
  },
  {
    id: 'faq-nf',
    question: "What is Gillian's advocacy role with Neurofibromatosis (NF)?",
    answer: "For decades, Gillian has been a committed, active patron of the Children's Tumor Foundation (CTF) and Neurofibromatosis Association. Inspired by her late brother Aaron, who lived with NF, she has testified before the United States Congress to advocate for federal research funding and continues to lead campaigns that provide support and visibility for families affected by the condition.",
    category: "advocacy"
  }
];

export default function FAQSection() {
  const { content } = useGlobalState();
  const FAQ_DATA = content.faqEntries.length > 0 ? content.faqEntries : FAQ_DATA_FALLBACK;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'advocacy' | 'career' | 'community' | 'g-spot'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-sayes'); // Default first expanded
  
  // Interactive "helpful" counts stored locally
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'yes' | 'no' | null>>({});

  const categories = [
    { value: 'all', label: 'ALL QUESTIONS' },
    { value: 'advocacy', label: 'ADVOCACY & CHARITY' },
    { value: 'career', label: 'STAGE & SCREEN' },
    { value: 'community', label: 'CO-OP & BOOKS' },
    { value: 'g-spot', label: 'G-SPOT WELLNESS' }
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
      case 'advocacy':
        return <Award className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'career':
        return <Sparkles className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'community':
        return <BookOpen className="h-3.5 w-3.5 text-gold-500/80" />;
      case 'g-spot':
        return <MessageSquare className="h-3.5 w-3.5 text-gold-500/80" />;
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
            Discover detailed insights about Gillian’s co-operative mentorship programs, official product details, and advocacy works.
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
