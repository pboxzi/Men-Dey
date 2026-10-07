import {motion, useReducedMotion} from 'motion/react';
import {useEffect} from 'react';
import {Outlet} from 'react-router-dom';

/**
 * Nav-free shell for the private gate and every public authentication route.
 * One editorial portrait carries the whole surface; each screen renders its own
 * brand chrome and sits directly on the photograph — no cards, no navigation.
 */
export function PublicLayout() {
  const reduce = useReducedMotion() === true;

  useEffect(() => {
    document.body.classList.add('gate-mode');
    return () => {
      document.body.classList.remove('gate-mode');
    };
  }, []);

  return (
    <div className="relative isolate min-h-[100svh] w-full overflow-hidden bg-[#100F0D]">
      <motion.div
        aria-hidden
        className="gate-hero absolute inset-0"
        style={{backgroundImage: "url('/assets/images/ga-gate-hero.jpg')"}}
        initial={reduce ? {opacity: 1} : {opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: reduce ? 0 : 1.2, ease: 'easeOut'}}
      />
      <div className="gate-scrim-a absolute inset-0" aria-hidden />
      <div className="gate-scrim-b absolute inset-0" aria-hidden />

      <main className="relative z-10 min-h-[100svh]">
        <Outlet />
      </main>
    </div>
  );
}
