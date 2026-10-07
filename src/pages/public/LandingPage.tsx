import {useEffect} from 'react';

import {ArrowRight} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {Link} from 'react-router-dom';

import {GateBrand} from '../../components/auth/GateBrand';

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const CRISP_WEBSITE_ID = '27e74bb1-7405-4ac9-86b0-57c81dcf93cd';

type CrispWindow = Window & {$crisp?: unknown[]; CRISP_WEBSITE_ID?: string};

export function LandingPage() {
  const reduce = useReducedMotion() === true;

  useEffect(() => {
    const w = window as CrispWindow;
    if (!w.$crisp) {
      w.$crisp = [];
      w.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
      const script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      document.head.appendChild(script);
    } else {
      w.$crisp.push(['do', 'chat:show']);
    }
    return () => {
      w.$crisp?.push(['do', 'chat:hide']);
    };
  }, []);

  const rise = (delay: number) => ({
    initial: reduce ? {opacity: 1, y: 0} : {opacity: 0, y: 18},
    animate: {opacity: 1, y: 0},
    transition: {
      duration: reduce ? 0 : 0.7,
      delay: reduce ? 0 : delay,
      ease: EASE,
    },
  });

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col px-6 pb-9 pt-8 sm:px-10 sm:pb-11 sm:pt-10 lg:px-16 lg:pb-14 lg:pt-14">
      <motion.div {...rise(0.12)}>
        <GateBrand />
      </motion.div>

      <div className="gate-spacer" aria-hidden />

      <motion.div {...rise(0.34)} className="gate-copy-block">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="h-px w-10 shrink-0 bg-[#C89B3C]/85 sm:w-14" aria-hidden />
          <p className="text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.34em] text-[#C89B3C] sm:text-[0.66rem] sm:tracking-[0.4em]">
            Welcome to the official office
          </p>
        </div>

        <h1 className="gate-title font-display font-normal text-[#FCFAF7]">
          So glad you&rsquo;re here.
          <br />
          Let&rsquo;s begin something
          <br />
          personal together.
        </h1>

        <p className="gate-lede max-w-[30rem] text-[#E6E0D6]">
          This is the official office of Gillian Anderson Management &mdash; a warm,
          considered place where every introduction, request and membership conversation is
          read by the team itself. Take your time; we&rsquo;ll look after the rest.
        </p>

        <div className="gate-actions flex flex-col sm:flex-row">
          <Link to="/sign-in" className="gate-btn-primary group">
            Sign in
            <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
          <Link to="/acknowledgement" className="gate-btn-secondary group">
            Create account
            <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        <p className="gate-statement flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.5625rem] uppercase leading-none tracking-[0.3em] text-[#EAE4DA]/75 sm:gap-x-5 sm:text-[0.625rem] sm:tracking-[0.34em]">
          <span>Personal</span>
          <span aria-hidden className="text-[#C89B3C]">
            &middot;
          </span>
          <span>Welcomed</span>
          <span aria-hidden className="text-[#C89B3C]">
            &middot;
          </span>
          <span>Cared for</span>
        </p>
      </motion.div>
    </div>
  );
}
