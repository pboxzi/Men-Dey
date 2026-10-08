import {useEffect, useRef} from 'react';

const INCLUDED_LANGUAGES =
  'af,sq,am,ar,hy,az,eu,bn,bs,bg,ca,zh-CN,zh-TW,co,cs,da,nl,et,fi,fr,fy,gl,ka,de,el,gu,ht,ha,he,hu,is,ig,id,ga,it,ja,jv,kn,kk,km,ko,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,no,or,ps,fa,pl,pt,pa,ro,ru,sm,sr,sn,sd,si,sk,sl,so,es,su,sw,sv,tl,tg,ta,tt,te,th,tr,tk,uk,ur,ug,uz,vi,cy,xh,yi,yo,zu';

const SUPPORTED = new Map<string, string>(
  INCLUDED_LANGUAGES.split(',').map((code) => [code.toLowerCase(), code]),
);

type TranslateElementCtor = new (
  options: {pageLanguage: string; includedLanguages: string; autoDisplay: boolean},
  target: HTMLElement,
) => void;

interface TranslateWindow extends Window {
  googleTranslateElementInit?: () => void;
  google?: {translate?: {TranslateElement?: TranslateElementCtor}};
}

function autoTargetLanguage(): string | null {
  const candidates = [
    ...(navigator.languages ?? []),
    ...(navigator.language ? [navigator.language] : []),
  ];
  for (const raw of candidates) {
    const value = raw.trim().toLowerCase();
    if (!value) continue;
    if (value === 'en' || value.startsWith('en-')) return null;
    const direct = SUPPORTED.get(value);
    if (direct) return direct;
    const base = SUPPORTED.get(value.split('-')[0]);
    if (base) return base;
  }
  return null;
}

function rememberLanguage(code: string) {
  const value = `googtrans=/en/${code}`;
  document.cookie = `${value}; path=/`;
  const host = window.location.hostname;
  if (host) {
    document.cookie = `${value}; path=/; domain=${host}`;
    if (host.includes('.')) {
      document.cookie = `${value}; path=/; domain=.${host}`;
    }
  }
}

export function GoogleTranslate() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const hasChoice = document.cookie
      .split(';')
      .some((entry) => entry.trim().startsWith('googtrans='));
    if (!hasChoice) {
      const target = autoTargetLanguage();
      if (target) rememberLanguage(target);
    }

    const w = window as TranslateWindow;
    w.googleTranslateElementInit = () => {
      const TranslateElement = w.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      new TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: INCLUDED_LANGUAGES,
          autoDisplay: false,
        },
        host,
      );
    };

    const existing = document.getElementById('ga-translate-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'ga-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (w.google?.translate?.TranslateElement && !host.hasChildNodes()) {
      w.googleTranslateElementInit();
    }
  }, []);

  return (
    <div
      id="ga-translate"
      ref={hostRef}
      className="fixed bottom-4 right-4 z-[70] flex min-h-11 max-w-[calc(100vw-2rem)] items-center overflow-hidden rounded-full border border-stone bg-white px-1 py-1 shadow-[0_12px_30px_-16px_rgba(30,30,30,0.45)]"
    />
  );
}
