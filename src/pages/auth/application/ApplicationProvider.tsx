import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Navigate, Outlet, useNavigate} from 'react-router-dom';

import {getStoredAck} from '../../../auth/ack';
import {useAuth} from '../../../auth/AuthContext';
import {FullPageLoader} from '../../../components/ui/FullPageLoader';
import {toFriendlyMessage} from '../../../lib/errors';
import {clearDraft, loadDraft, saveDraft, type ApplicationDraft} from './draft';

interface ApplicationContextValue {
  draft: ApplicationDraft;
  update: (patch: Partial<ApplicationDraft>) => void;
  submit: (password: string) => Promise<{needsVerification: boolean}>;
}

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export function ApplicationProvider() {
  const {loading: authLoading, isAuthenticated, signUp} = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ApplicationDraft>(() => loadDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const update = useCallback((patch: Partial<ApplicationDraft>) => {
    setDraft((current) => ({...current, ...patch}));
  }, []);

  const submit = useCallback(
    async (password: string) => {
      const ack = getStoredAck();
      if (!ack) throw new Error('acknowledgement required before account creation');

      const result = await signUp({
        email: draft.email.trim(),
        password,
        data: {
          full_name: draft.fullName.trim(),
          phone: draft.phone.trim(),
          country: draft.country.trim(),
          city: draft.city.trim(),
          occupation: draft.occupation.trim(),
          company: draft.company.trim(),
          preferred_contact_method: draft.preferredContactMethod,
          ack_version: String(ack.version),
          ack_at: ack.at,
          reason_for_joining: draft.reasonForJoining.trim(),
          platform_motivation: draft.platformMotivation.trim(),
          connection_interest: draft.connectionInterest.trim(),
          experience_interests: draft.experienceInterests,
          contact_email_ok: draft.contactEmailOk,
          contact_phone_ok: draft.contactPhoneOk,
          contact_whatsapp_ok: draft.contactWhatsappOk,
          whatsapp_number: draft.whatsappNumber.trim(),
        },
      });
      clearDraft();
      if (result.needsVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(draft.email.trim())}`, {replace: true});
      } else {
        navigate('/home', {replace: true});
      }
      return result;
    },
    [draft, navigate, signUp],
  );

  const value = useMemo(() => ({draft, update, submit}), [draft, update, submit]);

  if (authLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/home" replace />;

  return <ApplicationContext.Provider value={value}><Outlet /></ApplicationContext.Provider>;
}

// Wizard-level gate: acknowledgement accepted and no active session.
export function ApplicationGate() {
  const {loading: authLoading, isAuthenticated} = useAuth();
  const hasAck = getStoredAck() !== null;

  if (authLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  if (!hasAck) return <Navigate to="/acknowledgement" replace />;
  return <Outlet />;
}

export function useApplication(): ApplicationContextValue {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplication must be used inside <ApplicationProvider>');
  return ctx;
}
