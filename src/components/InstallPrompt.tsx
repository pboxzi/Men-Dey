import {Download} from 'lucide-react';
import {useEffect, useState} from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

const DISMISS_KEY = 'gma_install_prompt_dismissed_at';
const DISMISS_DAYS = 14;
const PROMPT_DELAY_MS = 2500;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari exposes navigator.standalone.
    (window.navigator as Navigator & {standalone?: boolean}).standalone === true
  );
}

function recentlyDismissed(): boolean {
  const stored = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
  if (!stored) return false;
  return Date.now() - stored < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      setIosHint(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    const timer = window.setTimeout(() => {
      if (isStandalone() || recentlyDismissed()) return;
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        setIosHint(true);
        setVisible(true);
      }
    }, PROMPT_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  // Show the native prompt card once the browser hands us the event.
  useEffect(() => {
    if (!deferred || recentlyDismissed()) return;
    const timer = window.setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [deferred]);

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferred) return;
    setVisible(false);
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferred(null);
  };

  const show = visible && (Boolean(deferred) || iosHint);

  return (
    <div
      role="dialog"
      aria-label="Install the app"
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-[80] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[130%] opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-[#EAE4DA] bg-white/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14171A]">
          <Download className="h-5 w-5 text-[#C89B3C]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1E1E1E]">Install the app</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6E6A63]">
            {iosHint && !deferred
              ? 'On iPhone: tap Share, then “Add to Home Screen” for the full app experience.'
              : 'Add Gillian Anderson Management to your home screen for a faster, full-screen experience.'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {deferred ? (
              <button
                type="button"
                onClick={() => void install()}
                className="btn btn-primary !px-4 !py-2 !text-xs"
              >
                Install
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="btn btn-ghost !px-3 !py-2 !text-xs"
            >
              {iosHint && !deferred ? 'Got it' : 'Not now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
