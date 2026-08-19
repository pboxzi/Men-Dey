import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';
import type { FilmData, LiteraryWork, KindnessLogEntry, QuizQuestion } from '../types';
import {
  BookOpen,
  Film,
  Heart,
  Volume2,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Calendar,
  Gift,
  Sparkles,
  Trophy,
  Coffee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AboutSection() {
  const { content } = useGlobalState();
  const [activeTab, setActiveTab] = useState<'journey' | 'films' | 'humanitarian' | 'literary' | 'kindness' | 'quiz'>('journey');

  // Interactive Tab 2: Film Explorer state
  const [selectedFilmIdx, setSelectedFilmIdx] = useState(0);

  // Interactive Tab 4: Audiobook Excerpt state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Interactive Tab 5: Kindness Log category
  const [kindnessFilter, setKindnessFilter] = useState<'all' | 'stunts' | 'charity' | 'fans'>('all');

  // Interactive Tab 6: Quiz state
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Film Explorer Data (from DB)
  const FILMS_DATA = (content.filmsData as any[] || []).map((f) => ({
    title: f.title,
    role: f.role,
    year: f.year,
    tagline: f.tagline,
    revenue: f.revenue,
    trivia: f.trivia,
    icon: f.icon,
    stuntDetail: f.stunt_detail,
  }));

  // Literary Works Audiobook List (from DB)
  const LITERARY_WORKS = (content.literaryWorks as any[] || []).map((w) => ({
    title: w.title,
    duration: w.duration,
    vibe: w.vibe,
  }));

  // Kindness Acts Data (from DB)
  const KINDNESS_LOG = (content.kindnessLog as any[] || []).map((k) => ({
    id: k.id,
    title: k.title,
    category: k.category,
    description: k.description,
    quote: k.quote,
  }));

  // Quiz Questions Data (from DB)
  const QUIZ_QUESTIONS = (content.quizQuestions as any[] || []).map((q) => ({
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
  }));

  const filteredKindness = kindnessFilter === 'all' 
    ? KINDNESS_LOG 
    : KINDNESS_LOG.filter(item => item.category === kindnessFilter);

  // Handle Quiz selection
  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === QUIZ_QUESTIONS[currentQuestionIdx].correct;
    const points = isCorrect ? 1 : 0;

    setSelectedAnswer(null);
    setShowExplanation(false);

    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      if (quizScore !== null) {
        setQuizScore(prev => (prev !== null ? prev + points : points));
      } else {
        setQuizScore(points);
      }
    } else {
      // Completed last question
      if (quizScore !== null) {
        setQuizScore(prev => prev + points);
      } else {
        setQuizScore(points);
      }
      setCurrentQuestionIdx(999); // trigger end screen
    }
  };

  const restartQuiz = () => {
    setQuizScore(null);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  return (
    <section id="about" className="relative section-luxury overflow-hidden bg-[#FCFAF7]">
      {/* Background visual graphics */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C89B3C]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10 text-center">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto space-y-3 mb-16">
          <span className="font-mono text-[10px] tracking-[0.25em] text-[#C89B3C] uppercase font-semibold">
            BIOGRAPHY & FOCUS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-[#111] tracking-tight uppercase">
            Everything About <span className="text-[#C89B3C]">Gillian</span>
          </h2>
          <div className="h-[2px] w-12 bg-[#C89B3C] mx-auto mt-4" />
        </div>

        {/* Tab Navigation Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12">
          {[
            { id: 'journey', label: 'JOURNEY & PHILOSOPHY', icon: BookOpen },
            { id: 'films', label: 'FILMOGRAPHY & ROLES', icon: Film },
            { id: 'humanitarian', label: 'SAYes & HUMANITARIAN', icon: Heart },
            { id: 'literary', label: 'LITERARY & ADVOCACY', icon: Volume2 },
            { id: 'kindness', label: 'ACTS OF KINDNESS', icon: Heart },
            { id: 'quiz', label: 'WISDOM & TRIVIA QUIZ', icon: HelpCircle },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-semibold tracking-[0.1em] transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#C89B3C] text-white shadow-sm'
                    : 'bg-white text-[#444] hover:text-[#1E1E1E]'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Contents */}
        <div className="min-h-[460px] rounded-[20px] bg-[#F8F6F2] p-6 md:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.08)]">
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Journey & Philosophy */}
            {activeTab === 'journey' && (
              <motion.div
                key="journey"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-8 lg:grid-cols-12 items-center"
              >
                {/* Visual */}
                <div className="lg:col-span-5 relative">
                  <div className="aspect-[4/5] rounded-[20px] overflow-hidden bg-white relative">
                    <img
                      src="/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg"
                      alt="Gillian Anderson Looking Reflective"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    
                    {/* Philosophical Stat overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-[#F8F6F2]/95 border border-[rgba(0,0,0,0.08)] p-3.5 rounded-lg">
                      <p className="font-serif italic text-xs text-[#444]">
                        "I've always been drawn to characters who are unapologetically themselves — complex, flawed, and absolutely refusing to shrink."
                      </p>
                      <span className="block mt-1.5 font-mono text-[11px] text-[#C89B3C] text-right">
                        — GILLIAN ANDERSON, SMITHSONIAN 2018
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">01 // LIFE & LEGACY</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#111]">
                      Three Decades of Defiance & Depth
                    </h3>
                  </div>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    Born August 9, 1968 in Chicago, Gillian Anderson spent her childhood shuttling between London, where she attended colloquiums and developed an early love of theatre, and Grand Rapids, Michigan. At 18 she enrolled at Cornell University, then trained at the National Theatre of Great Britain's drama program — one of the youngest Americans ever accepted.
                  </p>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    In 1992, at just 24, she was cast as FBI Special Agent Dana Scully. Over nine seasons and two feature films, "The Scully Effect" documented a measurable, real-world surge in women pursuing STEM careers — a cultural shift the 2018 Geena Davis Institute confirmed was directly tied to her portrayal. She won the Primetime Emmy for Outstanding Lead Actress in 1997.
                  </p>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    Post-X-Files, Gillian built one of the most versatile careers in television: Stella Gibson in <em>The Fall</em>, Dr. Jean Milburn in <em>Sex Education</em>, Margaret Thatcher in <em>The Crown</em> (winning both an Emmy and Golden Globe in 2021), and Clarice Starling in <em>Hannibal</em>. On stage, her Blanche DuBois in <em>A Streetcar Named Desire</em> earned an Olivier Award nomination and was called "the performance of the decade" by <em>The Guardian</em>.
                  </p>

                  {/* Highlight quotes card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-4 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2 text-[#C89B3C]">
                        <Trophy className="h-4 w-4" />
                        <span className="text-[10px] font-mono tracking-wider font-bold">ON EQUAL PAY</span>
                      </div>
                      <p className="text-[11px] text-[#444] font-sans italic">
                        "I was offered half my co-star's salary for the X-Files reboot. I refused. It was shocking, but I stood my ground because it was the right thing to do."
                      </p>
                      <span className="block text-[10px] font-mono text-[#444]">
                        — The Guardian, 2016
                      </span>
                    </div>

                    <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-4 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2 text-[#C89B3C]">
                        <Coffee className="h-4 w-4" />
                        <span className="text-[10px] font-mono tracking-wider font-bold">ON THE SCULLY EFFECT</span>
                      </div>
                      <p className="text-[11px] text-[#444] font-sans italic">
                        "Hearing women tell me they became scientists or doctors because of Scully is the most meaningful thing I've ever been part of."
                      </p>
                      <span className="block text-[10px] font-mono text-[#444]">
                        — Smithsonian Magazine, 2018
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center gap-6">
                    <div>
                      <span className="block text-xl font-bold text-[#111]">1993</span>
                      <span className="text-[11px] font-mono text-[#444] uppercase tracking-widest">X-Files Debut</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white" />
                    <div>
                      <span className="block text-xl font-bold text-[#C89B3C]">2</span>
                      <span className="text-[11px] font-mono text-[#444] uppercase tracking-widest">Emmy Awards</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white" />
                    <div>
                      <span className="block text-xl font-bold text-[#111]">80+</span>
                      <span className="text-[11px] font-mono text-[#444] uppercase tracking-widest">Screen Credits</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Filmography & Iconic Roles */}
            {activeTab === 'films' && (
              <motion.div
                key="films"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">02 // INTELLECTUAL ICONOGRAPHY</span>
                  <h3 className="font-serif text-2xl font-bold text-[#111]">
                    The Cinema of Transcendence
                  </h3>
                  <p className="text-xs text-[#444]">
                    From Scully to Thatcher, Gillian Anderson has redefined female authority across four decades and twelve iconic roles. Select a role below to explore.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Film side selectors */}
                  <div className="lg:col-span-4 space-y-2">
                    {FILMS_DATA.map((film, idx) => (
                      <button
                        key={film.title}
                        onClick={() => setSelectedFilmIdx(idx)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                          selectedFilmIdx === idx
                            ? 'bg-white border-[#C89B3C]/50 text-[#111]'
                            : 'bg-white border-[rgba(0,0,0,0.06)] text-[#444] hover:text-[#111] hover:border-[rgba(0,0,0,0.06)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{film.icon}</span>
                          <div>
                            <span className="block text-xs font-bold leading-snug">{film.title}</span>
                            <span className="block text-[11px] font-mono text-[#444] mt-0.5">{film.year}</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedFilmIdx === idx ? 'text-[#C89B3C] translate-x-1' : 'text-[#444]'}`} />
                      </button>
                    ))}
                  </div>

                  {/* Active Film Inspector Card */}
                  <div className="lg:col-span-8 bg-[#F8F6F2] border border-[rgba(0,0,0,0.1)] rounded-xl p-6 flex flex-col justify-between space-y-6 text-left relative overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                    <div className="absolute right-4 top-4 font-mono text-6xl font-bold text-neutral-900/40 select-none pointer-events-none uppercase">
                      {FILMS_DATA[selectedFilmIdx].icon}
                    </div>

                    <div className="space-y-4">
                      {/* Title & Tagline */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#C89B3C] border border-[#C89B3C]/30 px-2 py-0.5 rounded uppercase">
                            {FILMS_DATA[selectedFilmIdx].role}
                          </span>
                          <span className="text-[10px] font-mono text-[#444]">
                            {FILMS_DATA[selectedFilmIdx].year}
                          </span>
                        </div>
                        <h4 className="font-serif text-xl md:text-2xl font-bold text-[#111] tracking-wide">
                          {FILMS_DATA[selectedFilmIdx].title}
                        </h4>
                        <p className="font-serif italic text-xs text-gold-400">
                          "{FILMS_DATA[selectedFilmIdx].tagline}"
                        </p>
                      </div>

                      {/* Info blocks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-[#444] uppercase tracking-widest block">Accolades & Legacy</span>
                          <span className="text-sm font-bold text-[#111] flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            {FILMS_DATA[selectedFilmIdx].revenue}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-[#444] uppercase tracking-widest block">Character & Posture Work</span>
                          <span className="text-[11px] text-[#444] leading-normal block italic font-sans font-medium">
                            {FILMS_DATA[selectedFilmIdx].stuntDetail}
                          </span>
                        </div>
                      </div>

                      {/* Trivia section */}
                      <div className="p-4 rounded-lg bg-[#F8F6F2] border border-[rgba(0,0,0,0.06)] space-y-1.5">
                        <span className="text-[11px] font-mono text-[#C89B3C] font-bold uppercase tracking-widest block">Did You Know?</span>
                        <p className="text-[11px] text-[#444] leading-relaxed font-sans">
                          {FILMS_DATA[selectedFilmIdx].trivia}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]/80 flex items-center justify-between text-[11px] font-mono text-[#444]">
                      <span>THE SCULLY EFFECT INSPIRED GENERATIONS OF WOMEN IN STEM</span>
                      <span className="text-[#C89B3C]/80 uppercase font-semibold">VERIFIED BIOGRAPHY LOG</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: SAYes & Humanitarian */}
            {activeTab === 'humanitarian' && (
              <motion.div
                key="humanitarian"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-8 lg:grid-cols-12 items-center"
              >
                {/* Text info */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">03 // ACTIVE HUMANITARIAN CHANGE</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#111] uppercase">
                      SAYes Mentoring & Global Advocacy
                    </h3>
                  </div>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    In 2011, Gillian co-founded <strong>SAYes Mentoring</strong> in Cape Town, South Africa — an organization that matches young people leaving state care with trained adult mentors for structured 18-month programs. Since its founding, SAYes has mentored over 1,000 youth, helping them transition to independent adult lives with education, employment, and life skills.
                  </p>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    Her advocacy extends globally. She is a longtime patron of the <strong>Children's Tumor Foundation</strong> (NF research, inspired by her late brother Aaron), a <strong>UN Women HeForShe</strong> champion, an active supporter of <strong>Climate Revolution</strong>, and a vocal advocate for Afghan women's education rights. In 2016, she testified before the <strong>United States Congress</strong> to advocate for federal NF research funding.
                  </p>

                  {/* Highlights of Humanitarian work */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-[#111]">SAYes MENTORING</span>
                      <span className="block text-[10px] font-mono text-[#444] uppercase">1,000+ Youth Mentored Since 2011</span>
                    </div>
                    <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-[#C89B3C]">CTF PATRON</span>
                      <span className="block text-[10px] font-mono text-[#444] uppercase">NF Research — Testified Before Congress</span>
                    </div>
                    <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-[#111]">UN WOMEN</span>
                      <span className="block text-[10px] font-mono text-[#444] uppercase">HeForShe Gender Equality Champion</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[10px] font-mono text-[#444]">
                    <span>CO-FOUNDED BY GILLIAN ANDERSON — CAPE TOWN, SA</span>
                    <a 
                      href="https://sayesmentoring.org" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#C89B3C] hover:text-gold-400 font-bold tracking-widest uppercase transition-colors"
                    >
                      VISIT SAYES MENTORING →
                    </a>
                  </div>
                </div>

                {/* Visual */}
                <div className="lg:col-span-5 relative">
                  <div className="aspect-[4/3] rounded-[20px] overflow-hidden bg-white relative">
                    <img
                      src="/assets/images/gillian_mentoring_warmth_1783349719383.jpg"
                      alt="Gillian Anderson Advocacy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover brightness-95 contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 border border-[rgba(0,0,0,0.06)] px-3 py-1.5 rounded-md font-mono text-[11px] text-[#111] tracking-widest uppercase font-semibold">
                      CAPE TOWN, SA
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[10px] font-mono text-[#C89B3C] uppercase tracking-widest font-bold">The SAYes Mission:</span>
                      <p className="font-serif italic text-sm text-white mt-1">
                        "Matching young people leaving care with trained mentors to build independent, fulfilling lives."
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: Literary & Advocacy */}
            {activeTab === 'literary' && (
              <motion.div
                key="literary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Content info */}
                <div className="space-y-6 text-left max-w-3xl">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">04 // VOICE, INTUITION, & WRITING</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#111] uppercase">
                      Literary Pursuits & Manifesto
                    </h3>
                  </div>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    Gillian is an accomplished author with a diverse body of work. In 2017, she co-authored <strong>We: A Manifesto for Women Everywhere</strong> with Jennifer Nadel — a vulnerable, practical guide outlining nine essential principles (honesty, compassion, peace) designed to support women in moving from self-sabotage into collective healing.
                  </p>

                  <p className="text-xs text-[#444] leading-relaxed font-sans">
                    She co-wrote the <em>EarthEnd Saga</em> trilogy with Jeff Rovin: <em>A Vision of Fire</em> (2013), <em>A Dream of Ice</em> (2015), and <em>The Sound of Seas</em> (2016) — a science-fiction series exploring interplanetary threats and human resilience. In 2024, she curated <strong>Want</strong>, a groundbreaking collection of anonymous letters from women worldwide mapping the unfiltered landscapes of modern female desire.
                  </p>

                  {/* Publications track record */}
                  <div className="border border-[rgba(0,0,0,0.06)] bg-[#F8F6F2] p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] pb-1.5">
                      <Calendar className="h-4 w-4 text-[#C89B3C]" />
                      <span className="text-[10px] font-mono font-bold tracking-wider text-[#111] uppercase">LITERARY PORTFOLIO</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#444] font-sans">1. We: A Manifesto for Women (2017)</span>
                        <span className="font-mono text-[11px] text-[#C89B3C] font-semibold">Co-authored with Jennifer Nadel</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#444] font-sans">2. A Vision of Fire (2013)</span>
                        <span className="font-mono text-[11px] text-[#444]">EarthEnd Saga Book 1 with Jeff Rovin</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#444] font-sans">3. A Dream of Ice (2015)</span>
                        <span className="font-mono text-[11px] text-[#444]">EarthEnd Saga Book 2</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#444] font-sans">4. The Sound of Seas (2016)</span>
                        <span className="font-mono text-[11px] text-[#444]">EarthEnd Saga Book 3</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#444] font-sans">5. Want (2024)</span>
                        <span className="font-mono text-[11px] text-[#C89B3C] font-semibold">Curated anonymous letters on female desire</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 5: Philanthropy & Kindness */}
            {activeTab === 'kindness' && (
              <motion.div
                key="kindness"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-left space-y-1.5">
                  <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">05 // QUIET CHARITY & HEART</span>
                  <h3 className="font-serif text-2xl font-bold text-[#111] uppercase">
                    The Kindness Registry
                  </h3>
                  <p className="text-xs text-[#444]">
                    Gillian's defining characteristic is her extreme, active support for human rights and individual worth. Filter verified stories below.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'SHOW ALL STORIES' },
                    { id: 'charity', label: 'HUMANITARIAN WORK' },
                    { id: 'stunts', label: 'EQUAL PAY ADVOCACY' },
                    { id: 'fans', label: 'EMPOWERING FANS' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setKindnessFilter(f.id as typeof kindnessFilter)}
                      className={`px-3 py-1.5 rounded text-[11px] font-mono tracking-wider transition-colors border ${
                        kindnessFilter === f.id
                          ? 'bg-[#C89B3C]/10 border-[#C89B3C]/40 text-[#C89B3C]'
                          : 'bg-white border-[rgba(0,0,0,0.06)]/60 text-[#444] hover:text-[#111]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Grid of Kindness Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {filteredKindness.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-[#F8F6F2] p-5 rounded-[16px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.08)] flex flex-col justify-between space-y-4 text-left hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.1)] transition-all duration-300"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(0,0,0,0.06)] uppercase text-[#444] tracking-widest font-bold">
                            {item.category === 'stunts' ? 'equality' : item.category}
                          </span>
                          <Gift className="h-3.5 w-3.5 text-[#C89B3C]/60" />
                        </div>
                        <h4 className="font-serif text-sm font-bold text-[#111]">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#444] leading-relaxed font-sans">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[rgba(0,0,0,0.06)]/60 space-y-1">
                        <span className="text-[10px] font-mono text-[#444] uppercase block tracking-wider">RESPONSE & OUTLOOK</span>
                        <p className="font-serif italic text-[10px] text-[#C89B3C]/90 leading-normal">
                          "{item.quote}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab 6: Wisdom & Trivia Quiz */}
            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto space-y-6 text-left"
              >
                {/* Intro/Header */}
                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-mono text-[#C89B3C] tracking-wider">06 // TEST YOUR FAN WISDOM</span>
                  <h3 className="font-serif text-2xl font-bold text-[#111] uppercase">
                    The Gillian Anderson Wisdom Challenge
                  </h3>
                  <p className="text-xs text-[#444]">
                    Are you a true expert on Gillian's life, career, and acts of goodness? Take this mini interactive quiz.
                  </p>
                </div>

                {/* Quiz Body */}
                {currentQuestionIdx !== 999 ? (
                  <div className="bg-[#F8F6F2] border border-[rgba(0,0,0,0.06)] p-6 rounded-xl space-y-6">
                    {/* Status bar */}
                    <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-3">
                      <span className="text-[10px] font-mono text-[#444]">
                        QUESTION {currentQuestionIdx + 1} OF {QUIZ_QUESTIONS.length}
                      </span>
                      <span className="text-[10px] font-mono text-[#C89B3C] font-bold uppercase">
                        GILLIANOLOGY SKILLS
                      </span>
                    </div>

                    {/* Question text */}
                    <h4 className="font-serif text-base font-bold text-[#111] tracking-wide">
                      {QUIZ_QUESTIONS[currentQuestionIdx].question}
                    </h4>

                    {/* Options list */}
                    <div className="grid gap-3">
                      {QUIZ_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                        let btnStyle = 'bg-white border-[rgba(0,0,0,0.06)] text-[#444] hover:bg-neutral-100 hover:border-neutral-700';
                        
                        if (showExplanation) {
                          if (idx === QUIZ_QUESTIONS[currentQuestionIdx].correct) {
                            btnStyle = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold';
                          } else if (selectedAnswer === idx) {
                            btnStyle = 'bg-red-500/10 border-red-500/60 text-red-400';
                          } else {
                            btnStyle = 'bg-[#F8F6F2] border-[rgba(0,0,0,0.06)]/60 text-[#444] cursor-not-allowed';
                          }
                        }

                        return (
                          <button
                            key={option}
                            onClick={() => handleAnswerSelect(idx)}
                            disabled={showExplanation}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{option}</span>
                            {showExplanation && idx === QUIZ_QUESTIONS[currentQuestionIdx].correct && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                            {showExplanation && selectedAnswer === idx && idx !== QUIZ_QUESTIONS[currentQuestionIdx].correct && (
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Dynamic explanation panel */}
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-lg bg-white border border-[rgba(0,0,0,0.06)]/80 space-y-2 overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#C89B3C]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Gillian's Wisdom Insight:</span>
                          </div>
                          <p className="text-xs text-[#444] font-sans leading-relaxed">
                            {QUIZ_QUESTIONS[currentQuestionIdx].explanation}
                          </p>

                          <button
                            onClick={handleNextQuestion}
                            className="mt-3 bg-[#C89B3C] hover:bg-[#A97828] text-neutral-950 font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded transition-colors self-end block ml-auto"
                          >
                            {currentQuestionIdx === QUIZ_QUESTIONS.length - 1 ? 'VIEW RESULTS' : 'NEXT QUESTION →'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Quiz End / Results view */
                  <div className="bg-[#F8F6F2] border border-[rgba(0,0,0,0.06)] p-8 rounded-xl space-y-6 text-center">
                    <div className="inline-flex p-4 rounded-full bg-[#C89B3C]/10 border border-[#C89B3C]/30 text-[#C89B3C]">
                      <Trophy className="h-10 w-10" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-serif text-2xl font-extrabold text-[#111] uppercase tracking-wider">
                        QUIZ COMPLETED!
                      </h4>
                      <p className="text-xs text-[#444]">
                        You scored <span className="text-[#C89B3C] font-bold text-sm">{quizScore} / {QUIZ_QUESTIONS.length}</span> correct answers.
                      </p>
                    </div>

                    {/* Custom title evaluation */}
                    <div className="p-4 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] inline-block max-w-sm mx-auto">
                      <span className="block text-[10px] font-mono text-[#444] uppercase tracking-widest">YOUR FAN RANK</span>
                      <span className="text-sm font-bold text-[#C89B3C] block uppercase tracking-wide mt-1">
                        {quizScore === 3 ? "👑 Dana Scully / FBI Special Agent" : quizScore === 2 ? "🎭 West End Theater Master" : "📚 Manifesto Feminist Rookie"}
                      </span>
                      <p className="text-[11px] text-[#444] font-sans mt-2">
                        {quizScore === 3 
                          ? "Incredible! Your knowledge of Gillian's career, philanthropy, and writings is truly inspiring. Keep seeking the truth!" 
                          : "Great effort! You clearly appreciate Gillian's brilliant work and activist heart. Stay curious!"}
                      </p>
                    </div>

                    <button
                      onClick={restartQuiz}
                      className="block mx-auto border border-[#C89B3C]/50 hover:bg-[#C89B3C]/5 text-[#C89B3C] px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
                    >
                      TAKE CHALLENGE AGAIN
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
