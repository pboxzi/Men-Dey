import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Award,
  Calendar,
  Send,
  CheckCircle,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Info
} from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  duration: string;
  location: string;
  intensity: string;
  capacity: string;
  description: string;
  details: string[];
}

export default function ExperiencesSection() {
  const [selectedExperience, setSelectedExperience] = useState<string>('exp-1');
  const [submittedRequests, setSubmittedRequests] = useState<any[]>([
    {
      id: 'req-initial-1',
      experienceTitle: 'West End Stage: Private Acting Masterclass',
      story: 'I have been studying dramatic theater for over ten years and have always dreamed of learning character posture and physical presence from Gillian Anderson.',
      status: 'reviewing',
      statusText: 'Under Artistic Review',
      date: 'May 10, 2024',
    },
    {
      id: 'req-initial-2',
      experienceTitle: 'SAYes Mentoring: Cape Town Retreat',
      story: 'Looking to launch a youth transition shelter in my city. Cooperating and getting advice from Gillian and the SAYes team in South Africa would complete this vision.',
      status: 'approved',
      statusText: 'Scheduling Consultation',
      date: 'April 22, 2024',
    }
  ]);

  const [story, setStory] = useState('');
  const [proof, setProof] = useState('');
  const [reqSuccess, setReqSuccess] = useState(false);

  const experiences: Experience[] = [
    {
      id: 'exp-1',
      title: 'West End Stage: Private Acting Masterclass',
      duration: '2 Days',
      location: 'London, UK',
      intensity: 'High Intensity',
      capacity: '2 Fans per session',
      description: 'Train with actual West End directors and Gillian Anderson. Learn character posture, vocal projection, emotional depth, and rehearse an intense scene together on stage.',
      details: [
        'Vocal projection & cadence training',
        'Physical presence & emotional breathing mechanics',
        'Intimate character table reading',
        'Professional video of your staged dialogue'
      ]
    },
    {
      id: 'exp-2',
      title: 'The X-Files: Sci-Fi Forensic Hunt',
      duration: '3 Days',
      location: 'Vancouver, BC',
      intensity: 'Medium Intensity',
      capacity: '3 Fans per session',
      description: 'Join a mock forensic investigative team in the Pacific Northwest woods. Analyze scientific anomalies and practice skeptic forensic investigations guided by Agent Scully\'s analytical principles.',
      details: [
        'Mock crime scene investigation & evidence gathering',
        'Skeptical scientific methodology seminar',
        'Rain-soaked night tracking exercises',
        'Commemorative FBI-styled badge and field file'
      ]
    },
    {
      id: 'exp-3',
      title: 'SAYes Mentoring: Cape Town Retreat',
      duration: '5 Days',
      location: 'Cape Town, SA',
      intensity: 'Low Intensity',
      capacity: '2 Fans per session',
      description: 'Join Gillian Anderson and the executive team of SAYes in South Africa. Participate in mentoring workshops, meet care transitioning youth, and attend their private annual fundraiser gala.',
      details: [
        'Mentorship certification & training workshop',
        'Co-designing youth transition pathways',
        'Round-table dinner with Gillian and SAYes directors',
        'VIP access to the Cape Town Gala'
      ]
    },
    {
      id: 'exp-4',
      title: 'We Manifesto: Cozy Literary Dialogue',
      duration: '1 Day',
      location: 'London, UK',
      intensity: 'Low Intensity',
      capacity: '4 Fans per session',
      description: 'Sit down with Gillian Anderson and co-author Jennifer Nadel in a cozy private London library. Read excerpts, discuss the nine principles of self-worth, and explore women\'s advocacy.',
      details: [
        'Private book circle reading & discussion',
        'Guided self-compassion exercises',
        'Afternoon tea and personal Q&A',
        'Signed deluxe edition of the "We" Manifesto'
      ]
    }
  ];

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!story || !selectedExperience) return;

    const currentExp = experiences.find((e) => e.id === selectedExperience);
    if (!currentExp) return;

    const newReq = {
      id: `req-${Date.now()}`,
      experienceTitle: currentExp.title,
      story: story.trim(),
      status: 'pending',
      statusText: 'Team Read / Queueing',
      date: 'Just now'
    };

    setSubmittedRequests([newReq, ...submittedRequests]);
    setStory('');
    setProof('');
    setReqSuccess(true);

    setTimeout(() => {
      setReqSuccess(false);
    }, 4000);
  };

  const activeExpObj = experiences.find((e) => e.id === selectedExperience) || experiences[0];

  return (
    <section id="experiences-page" className="bg-[#050505] py-20 px-4 md:px-6 relative min-h-[900px]">
      <div className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-500 text-[10px] font-mono tracking-widest uppercase">
            <Award className="h-3.5 w-3.5" />
            ONCE-IN-A-LIFETIME REVERIES
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight">
            Exalted <span className="text-gold-500">Experiences</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Gillian believes in deep, authentic human experiences. Submit your request for an immersive, fully funded journey aligning with dramatic theater, scientific skepticism, mentorship, or literary discussion.
          </p>
        </div>

        {/* Dynamic Experiences Bento Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Experiences Cards Selection Sidebar - 5 Cols */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <h3 className="font-serif text-sm tracking-widest text-neutral-400 uppercase font-bold border-b border-neutral-900 pb-3">
              SELECT EXPERIENCE PRESET
            </h3>

            <div className="grid gap-3">
              {experiences.map((exp) => {
                const isSelected = exp.id === selectedExperience;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExperience(exp.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-gold-500/5 border-gold-500/40 shadow-lg'
                        : 'bg-neutral-950/30 border-neutral-900 hover:border-neutral-800 hover:bg-neutral-950/80'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h4 className={`text-sm font-bold tracking-wide ${isSelected ? 'text-gold-500' : 'text-white group-hover:text-gold-500'}`}>
                        {exp.title}
                      </h4>
                      <span className="text-[8px] font-mono border border-neutral-800 px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 uppercase shrink-0">
                        {exp.intensity}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed mt-1.5 line-clamp-2">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 mt-3 pt-2.5 border-t border-neutral-900/60">
                      <span>LOCATION: {exp.location}</span>
                      <span>•</span>
                      <span>DURATION: {exp.duration}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Experience Specification - 7 Cols */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeExpObj.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-6 shadow-xl space-y-6"
              >
                {/* Visual Title */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gold-500">
                    <span>SEATS: {activeExpObj.capacity}</span>
                    <span>•</span>
                    <span>INTENSITY: {activeExpObj.intensity}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-extrabold text-white tracking-wide uppercase">
                    {activeExpObj.title}
                  </h3>
                </div>

                {/* Extended Details list */}
                <div className="space-y-3 pt-3 border-t border-neutral-900/60">
                  <h4 className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase font-semibold">
                    INCLUDED EXPERIENTIAL MODULES:
                  </h4>
                  <ul className="space-y-2">
                    {activeExpObj.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                        <CheckCircle className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submitting form */}
                <div className="pt-6 border-t border-neutral-900/60 space-y-4">
                  <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-gold-500" />
                    SUBMIT STORY & APPLICATION
                  </h4>

                  {reqSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gold-500/10 border border-gold-500/30 p-3.5 rounded-lg flex items-center gap-2 text-xs text-gold-500 font-serif italic"
                    >
                      <ShieldCheck className="h-4.5 w-4.5 text-gold-500 shrink-0" />
                      <span>"Application received! Selection coordinators will review your files shortly."</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                        WHY IS THIS EXPERIENTIAL REVERIE SIGNIFICANT TO YOUR JOURNEY? *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Explain your alignment, your current aspirations, or how receiving this experience would empower your story. Be genuine..."
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                        SUPPORTING PROOF / SOCIAL DETAILS (URL OR TEXT)
                      </label>
                      <input
                        type="text"
                        placeholder="Link to portfolio, training records, or professional socials..."
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/40"
                      />
                    </div>

                    <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-900/60 flex items-start gap-2.5 text-[10px] text-neutral-400 leading-relaxed font-mono">
                      <Info className="h-4 w-4 text-gold-500 shrink-0" />
                      <span>Note: Gillian personally funds chosen experiences including travel, accommodation, and safety insurance. Applications are reviewed quarterly.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-bold py-2.5 rounded-lg tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      SUBMIT REQUEST FILE
                    </button>
                  </form>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Live Tracking Dashboard */}
        <div className="bg-neutral-950/40 border border-neutral-900 rounded-xl p-6 text-left space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-gold-500" />
              <h3 className="font-serif text-sm tracking-widest text-white uppercase font-bold">
                YOUR APPLICATION TIMELINE
              </h3>
            </div>
            <span className="text-[9px] font-mono text-neutral-500 uppercase">
              REPORTS REFRESHED DAILY
            </span>
          </div>

          <div className="space-y-4">
            {submittedRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-neutral-800"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">{req.experienceTitle}</span>
                    <span className="text-[8px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                      {req.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 italic line-clamp-1 max-w-xl">
                    "{req.story}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${req.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${req.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${req.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {req.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
