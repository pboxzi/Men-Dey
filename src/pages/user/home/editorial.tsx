import {motion, useReducedMotion} from 'motion/react';
import {ArrowRight} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion() === true;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () => reduce || typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {rootMargin: '0px 0px -40px 0px'},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce || visible ? {opacity: 1, y: 0} : {opacity: 0, y: 20}}
      animate={visible ? {opacity: 1, y: 0} : undefined}
      transition={{
        duration: reduce ? 0 : 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function EditorialCta({
  to,
  tone = 'light',
  children,
}: {
  to: string;
  tone?: 'light' | 'dark';
  children: ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-11 items-center gap-3 self-start text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors ${
        dark ? 'text-[#FCFAF7] hover:text-[#C89B3C]' : 'text-[#1E1E1E] hover:text-[#A67F2C]'
      }`}
    >
      <span>{children}</span>
      <span
        className="h-px w-9 bg-[#C89B3C] transition-all duration-300 group-hover:w-14"
        aria-hidden
      />
      <ArrowRight className="size-3.5 shrink-0 text-[#C89B3C]" aria-hidden />
    </Link>
  );
}

export function EditorialImage({
  src,
  alt,
  position = 'object-center',
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  position?: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`h-full w-full object-cover ${position} ${className}`}
    />
  );
}
