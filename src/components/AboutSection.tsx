import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalState } from '../utils/StateContext';
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
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);

  // Interactive Tab 5: Kindness Log category
  const [kindnessFilter, setKindnessFilter] = useState<'all' | 'stunts' | 'charity' | 'fans'>('all');

  // Interactive Tab 6: Quiz state
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Film Explorer Data (from DB)
  const FILMS_DATA = (content.filmsData || []).map((f: any) => ({
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
  const LITERARY_WORKS = (content.literaryWorks || []).map((w: any) => ({
    title: w.title,
    duration: w.duration,
    vibe: w.vibe,
  }));

  // Kindness Acts Data (from DB)
  const KINDNESS_LOG = (content.kindnessLog || []).map((k: any) => ({
    id: k.id,
    title: k.title,
    category: k.category,
    description: k.description,
    quote: k.quote,
  }));

  // Quiz Questions Data (from DB)
  const QUIZ_QUESTIONS = (content.quizQuestions || []).map((q: any) => ({
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
    <section id="about" className="relative py-24 border-b border-neutral-900/60 overflow-hidden bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
      {/* Background visual graphics */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10 text-center">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto space-y-3 mb-16">
          <span className="font-mono text-[10px] tracking-[0.25em] text-gold-500 uppercase font-semibold">
            BIOGRAPHY & FOCUS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            Everything About <span className="text-gold-500">Gillian</span>
          </h2>
          <div className="h-[2px] w-12 bg-gold-500 mx-auto mt-4" />
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all duration-300 ${
                  isSelected
                    ? 'bg-gold-500 border-gold-400 text-neutral-950 shadow-lg shadow-gold-500/10 font-bold scale-[1.02]'
                    : 'bg-neutral-950 border-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-800'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Contents */}
        <div className="min-h-[460px] rounded-2xl border border-neutral-900 bg-neutral-950/40 p-6 md:p-10 backdrop-blur-sm">
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
                  <div className="aspect-[4/5] rounded-xl overflow-hidden border border-neutral-900 bg-neutral-900 relative">
                    <img
                      src="/src/assets/images/gillian_thoughtful_outdoor_1783349709080.jpg"
                      alt="Gillian Anderson Looking Reflective"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover grayscale brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    
                    {/* Philosophical Stat overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-neutral-950/90 border border-neutral-900 p-3.5 rounded-lg">
                      <p className="font-serif italic text-xs text-neutral-300">
                        "The ones who support us are the ones who allow us to shine. Compassion and sisterhood are our true compass."
                      </p>
                      <span className="block mt-1.5 font-mono text-[9px] text-gold-500 text-right">
                        — GILLIAN ON EQUALITY & EMPATHY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gold-500 tracking-wider">01 // THE TRANSCENDENT PATH</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-white">
                      Intelligent Grace & Feminist Fire
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Born in Chicago and raised between London, England and Grand Rapids, Michigan, Gillian Anderson's childhood was defined by a rich tapestry of cultural shifts. After channeling her youthful rebellion into a profound passion for the theater, she quickly rose to international fame, defining some of the most intellectual and powerful female characters in modern television history.
                  </p>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Behind her award-winning portrayals lies an inspiring story of personal resilience and unwavering advocacy. Standing up early on for equal pay, raising her children while working exhausting hours on set, and championing the voices of vulnerable youth and women globally, Gillian Anderson exemplifies a standard of elegant strength, extreme curiosity, and deep empathy.
                  </p>

                  {/* Highlight quotes card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-neutral-900 bg-neutral-950/60 p-4 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2 text-gold-500">
                        <Trophy className="h-4 w-4" />
                        <span className="text-[10px] font-mono tracking-wider font-bold">ON INDEPENDENCE</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 font-sans italic">
                        "Be unapologetic about who you are, what you desire, and how you choose to live your life."
                      </p>
                      <span className="block text-[8px] font-mono text-neutral-500">
                        — Stella Gibson's Philosophy
                      </span>
                    </div>

                    <div className="border border-neutral-900 bg-neutral-950/60 p-4 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2 text-gold-500">
                        <Coffee className="h-4 w-4" />
                        <span className="text-[10px] font-mono tracking-wider font-bold">ON CURIOSITY</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 font-sans italic">
                        "The truth is out there, but so is the courage to look for it. Always keep seeking."
                      </p>
                      <span className="block text-[8px] font-mono text-neutral-500">
                        — Personal Outlook on Search
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-900 flex items-center gap-6">
                    <div>
                      <span className="block text-xl font-bold text-white">1986</span>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Theater Debut</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-900" />
                    <div>
                      <span className="block text-xl font-bold text-gold-500">120+</span>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Awards & Noms</span>
                    </div>
                    <div className="h-8 w-[1px] bg-neutral-900" />
                    <div>
                      <span className="block text-xl font-bold text-white">100%</span>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Empowering Advocacy</span>
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
                  <span className="text-[10px] font-mono text-gold-500 tracking-wider">02 // INTELLECTUAL ICONOGRAPHY</span>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    The Cinema of Transcendence
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Gillian Anderson redefined female authority and complexity across four decades. Select a role below to explore.
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
                            ? 'bg-neutral-900 border-gold-500/50 text-white'
                            : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{film.icon}</span>
                          <div>
                            <span className="block text-xs font-bold leading-snug">{film.title}</span>
                            <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">{film.year}</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedFilmIdx === idx ? 'text-gold-500 translate-x-1' : 'text-neutral-700'}`} />
                      </button>
                    ))}
                  </div>

                  {/* Active Film Inspector Card */}
                  <div className="lg:col-span-8 bg-neutral-950/90 border border-neutral-900 rounded-xl p-6 flex flex-col justify-between space-y-6 text-left relative overflow-hidden">
                    <div className="absolute right-4 top-4 font-mono text-6xl font-bold text-neutral-900/40 select-none pointer-events-none uppercase">
                      {FILMS_DATA[selectedFilmIdx].icon}
                    </div>

                    <div className="space-y-4">
                      {/* Title & Tagline */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gold-500 border border-gold-500/30 px-2 py-0.5 rounded uppercase">
                            {FILMS_DATA[selectedFilmIdx].role}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {FILMS_DATA[selectedFilmIdx].year}
                          </span>
                        </div>
                        <h4 className="font-serif text-xl md:text-2xl font-bold text-white tracking-wide">
                          {FILMS_DATA[selectedFilmIdx].title}
                        </h4>
                        <p className="font-serif italic text-xs text-gold-400">
                          "{FILMS_DATA[selectedFilmIdx].tagline}"
                        </p>
                      </div>

                      {/* Info blocks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Accolades & Legacy</span>
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            {FILMS_DATA[selectedFilmIdx].revenue}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Character & Posture Work</span>
                          <span className="text-[11px] text-neutral-300 leading-normal block italic font-sans font-medium">
                            {FILMS_DATA[selectedFilmIdx].stuntDetail}
                          </span>
                        </div>
                      </div>

                      {/* Trivia section */}
                      <div className="p-4 rounded-lg bg-neutral-900/40 border border-neutral-900 space-y-1.5">
                        <span className="text-[9px] font-mono text-gold-500 font-bold uppercase tracking-widest block">Did You Know?</span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          {FILMS_DATA[selectedFilmIdx].trivia}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-900/80 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                      <span>THE SCULLY EFFECT INSPIRED GENERATIONS OF WOMEN IN STEM</span>
                      <span className="text-gold-500/80 uppercase font-semibold">VERIFIED BIOGRAPHY LOG</span>
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
                    <span className="text-[10px] font-mono text-gold-500 tracking-wider">03 // ACTIVE HUMANITARIAN CHANGE</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-white uppercase">
                      SAYes Mentoring & Philanthropy
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Gillian Anderson is a passionate co-founder and active patron of <strong>SAYes Mentoring</strong>, an organization in South Africa that provides supportive transition-to-adulthood mentoring programs for youth leaving care homes. Rather than simply lending her name, she actively guides strategies to empower marginalized youngsters.
                  </p>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Her philanthropy stretches globally: she is an advocate for the <strong>Children's Tumor Foundation</strong> (supporting Neurofibromatosis research, a cause dedicated to her late brother Aaron), a major spokesperson for <strong>PETA</strong>, and a champion of feminist initiatives worldwide.
                  </p>

                  {/* Highlights of Humanitarian work */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    <div className="border border-neutral-900 bg-[#0c0c0c] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-white">SAYes</span>
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">Youth Mentorship in SA</span>
                    </div>
                    <div className="border border-neutral-900 bg-[#0c0c0c] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-gold-500">CTF PATRON</span>
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">Neurofibromatosis Advocacy</span>
                    </div>
                    <div className="border border-neutral-900 bg-[#0c0c0c] p-3 rounded-lg text-center space-y-1">
                      <span className="font-mono text-xs font-extrabold text-white">GENDER EQUITY</span>
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">Equal Pay Champion</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>CO-FOUNDED BY GILLIAN ANDERSON</span>
                    <a 
                      href="https://sayesmentoring.org" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gold-500 hover:text-gold-400 font-bold tracking-widest uppercase transition-colors"
                    >
                      VISIT SAYES MENTORING →
                    </a>
                  </div>
                </div>

                {/* Visual */}
                <div className="lg:col-span-5 relative">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-neutral-900 bg-neutral-900 relative">
                    <img
                      src="/src/assets/images/gillian_mentoring_warmth_1783349719383.jpg"
                      alt="Gillian Anderson Advocacy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover grayscale brightness-75 contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-neutral-950/95 border border-neutral-800 px-3 py-1.5 rounded-md font-mono text-[9px] text-white tracking-widest uppercase font-semibold">
                      CAPE TOWN, SA
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[10px] font-mono text-gold-500 uppercase tracking-widest font-bold">The SAYes Motto:</span>
                      <p className="font-serif italic text-sm text-white mt-1">
                        "Connecting young minds with positive guidance to shape tomorrow's leaders."
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
                className="grid gap-8 lg:grid-cols-12 items-center"
              >
                {/* Visual AUDIOBOOK PLAYER */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-[340px] bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 shadow-2xl space-y-4">
                    
                    {/* Retro Audiobook tape graphic */}
                    <div className="aspect-[1.6/1] w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 flex flex-col justify-between relative overflow-hidden">
                      {/* Reels simulation */}
                      <div className="flex items-center justify-between px-6 pt-4">
                        <div className={`h-10 w-10 rounded-full border-[3px] border-neutral-800 bg-neutral-900 flex items-center justify-center ${isPlayingAudio ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                          <div className="h-4 w-4 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                          </div>
                        </div>

                        <div className="h-2 w-16 rounded bg-neutral-900/70 border border-neutral-800 text-[8px] font-mono text-gold-500 flex items-center justify-center uppercase font-bold tracking-widest">
                          {isPlayingAudio ? "READING" : "MUTED"}
                        </div>

                        <div className={`h-10 w-10 rounded-full border-[3px] border-neutral-800 bg-neutral-900 flex items-center justify-center ${isPlayingAudio ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                          <div className="h-4 w-4 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                          </div>
                        </div>
                      </div>

                      {/* Label sticker */}
                      <div className="bg-neutral-900 border border-neutral-800 p-2 rounded text-center">
                        <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-widest font-bold">GILLIAN ANDERSON // AUTHOR READINGS</span>
                        <span className="block text-[8px] font-mono text-gold-500 mt-0.5 uppercase tracking-wider">
                          TITLE: {LITERARY_WORKS[selectedTrackIdx].title} ({LITERARY_WORKS[selectedTrackIdx].duration})
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between border-t border-neutral-800/80 pt-4 px-2">
                      <button 
                        onClick={() => {
                          setSelectedTrackIdx(prev => (prev > 0 ? prev - 1 : LITERARY_WORKS.length - 1));
                        }}
                        className="p-2 rounded bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 transition-colors text-[9px] font-mono"
                      >
                        PREV
                      </button>

                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className={`px-5 py-2 rounded-lg font-bold text-[10px] tracking-widest transition-colors flex items-center gap-1.5 border ${
                          isPlayingAudio
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-gold-500 border-gold-400 text-neutral-950'
                        }`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        {isPlayingAudio ? "PAUSE PREVIEW" : "PLAY AUDIO EXCERPT"}
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedTrackIdx(prev => (prev < LITERARY_WORKS.length - 1 ? prev + 1 : 0));
                        }}
                        className="p-2 rounded bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 transition-colors text-[9px] font-mono"
                      >
                        NEXT
                      </button>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">
                        VIBE: {LITERARY_WORKS[selectedTrackIdx].vibe}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Content info */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gold-500 tracking-wider">04 // VOICE, INTUITION, & WRITING</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-white uppercase">
                      Literary Pursuits & Manifesto
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Beyond performance art, Gillian Anderson is an accomplished author. In 2017, she co-authored <strong>We: A Manifesto for Women Everywhere</strong> along with Jennifer Nadel. The book is an incredibly transparent, vulnerable guide detailing nine essential principles—such as honesty, compassion, and peace—designed to support women in moving past self-sabotage into collective healing.
                  </p>

                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Gillian has also written science-fiction (co-authoring the <i>EarthEnd Saga</i> trilogy) and recently edited <strong>Want</strong>, a groundbreaking collection of anonymous letters written by women from around the globe mapping out the intricate, unfiltered landscapes of modern female desire.
                  </p>

                  {/* Publications track record */}
                  <div className="border border-neutral-900 bg-neutral-950/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 border-b border-neutral-900 pb-1.5">
                      <Calendar className="h-4 w-4 text-gold-500" />
                      <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">LITERARY PORTFOLIO EXCERPTS</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300 font-sans">1. We: A Manifesto</span>
                        <span className="font-mono text-[9px] text-gold-500 font-semibold">Self-compassion & sisterhood guide</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300 font-sans">2. EarthEnd Trilogy</span>
                        <span className="font-mono text-[9px] text-neutral-400">Sci-Fi mystery novels with Jeff Rovin</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300 font-sans">3. Want Anthology</span>
                        <span className="font-mono text-[9px] text-neutral-400">Curated compilation of women's true voices (2024)</span>
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
                  <span className="text-[10px] font-mono text-gold-500 tracking-wider">05 // QUIET CHARITY & HEART</span>
                  <h3 className="font-serif text-2xl font-bold text-white uppercase">
                    The Kindness Registry
                  </h3>
                  <p className="text-xs text-neutral-400">
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
                      onClick={() => setKindnessFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded text-[9px] font-mono tracking-wider transition-colors border ${
                        kindnessFilter === f.id
                          ? 'bg-gold-500/10 border-gold-500/40 text-gold-500'
                          : 'bg-neutral-950 border-neutral-900/60 text-neutral-400 hover:text-white'
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
                      className="border border-neutral-900 bg-neutral-950/80 p-5 rounded-xl flex flex-col justify-between space-y-4 text-left hover:border-neutral-800 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-neutral-800 uppercase text-neutral-400 tracking-widest font-bold">
                            {item.category === 'stunts' ? 'equality' : item.category}
                          </span>
                          <Gift className="h-3.5 w-3.5 text-gold-500/60" />
                        </div>
                        <h4 className="font-serif text-sm font-bold text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-900/60 space-y-1">
                        <span className="text-[8px] font-mono text-neutral-500 uppercase block tracking-wider">RESPONSE & OUTLOOK</span>
                        <p className="font-serif italic text-[10px] text-gold-500/90 leading-normal">
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
                  <span className="text-[10px] font-mono text-gold-500 tracking-wider">06 // TEST YOUR FAN WISDOM</span>
                  <h3 className="font-serif text-2xl font-bold text-white uppercase">
                    The Gillian Anderson Wisdom Challenge
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Are you a true expert on Gillian's life, career, and acts of goodness? Take this mini interactive quiz.
                  </p>
                </div>

                {/* Quiz Body */}
                {currentQuestionIdx !== 999 ? (
                  <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-xl space-y-6">
                    {/* Status bar */}
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <span className="text-[10px] font-mono text-neutral-400">
                        QUESTION {currentQuestionIdx + 1} OF {QUIZ_QUESTIONS.length}
                      </span>
                      <span className="text-[10px] font-mono text-gold-500 font-bold uppercase">
                        GILLIANOLOGY SKILLS
                      </span>
                    </div>

                    {/* Question text */}
                    <h4 className="font-serif text-base font-bold text-white tracking-wide">
                      {QUIZ_QUESTIONS[currentQuestionIdx].question}
                    </h4>

                    {/* Options list */}
                    <div className="grid gap-3">
                      {QUIZ_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                        let btnStyle = 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900/50 hover:border-neutral-700';
                        
                        if (showExplanation) {
                          if (idx === QUIZ_QUESTIONS[currentQuestionIdx].correct) {
                            btnStyle = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold';
                          } else if (selectedAnswer === idx) {
                            btnStyle = 'bg-red-500/10 border-red-500/60 text-red-400';
                          } else {
                            btnStyle = 'bg-neutral-950/40 border-neutral-900/60 text-neutral-500 cursor-not-allowed';
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
                          className="p-4 rounded-lg bg-neutral-950 border border-neutral-800/80 space-y-2 overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-gold-500">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Gillian's Wisdom Insight:</span>
                          </div>
                          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                            {QUIZ_QUESTIONS[currentQuestionIdx].explanation}
                          </p>

                          <button
                            onClick={handleNextQuestion}
                            className="mt-3 bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded transition-colors self-end block ml-auto"
                          >
                            {currentQuestionIdx === QUIZ_QUESTIONS.length - 1 ? 'VIEW RESULTS' : 'NEXT QUESTION →'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Quiz End / Results view */
                  <div className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-xl space-y-6 text-center">
                    <div className="inline-flex p-4 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500">
                      <Trophy className="h-10 w-10" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-serif text-2xl font-extrabold text-white uppercase tracking-wider">
                        QUIZ COMPLETED!
                      </h4>
                      <p className="text-xs text-neutral-400">
                        You scored <span className="text-gold-500 font-bold text-sm">{quizScore} / {QUIZ_QUESTIONS.length}</span> correct answers.
                      </p>
                    </div>

                    {/* Custom title evaluation */}
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 inline-block max-w-sm mx-auto">
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest">YOUR FAN RANK</span>
                      <span className="text-sm font-bold text-gold-500 block uppercase tracking-wide mt-1">
                        {quizScore === 3 ? "👑 Dana Scully / FBI Special Agent" : quizScore === 2 ? "🎭 West End Theater Master" : "📚 Manifesto Feminist Rookie"}
                      </span>
                      <p className="text-[11px] text-neutral-400 font-sans mt-2">
                        {quizScore === 3 
                          ? "Incredible! Your knowledge of Gillian's career, philanthropy, and writings is truly inspiring. Keep seeking the truth!" 
                          : "Great effort! You clearly appreciate Gillian's brilliant work and activist heart. Stay curious!"}
                      </p>
                    </div>

                    <button
                      onClick={restartQuiz}
                      className="block mx-auto border border-gold-500/50 hover:bg-gold-500/5 text-gold-500 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
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
