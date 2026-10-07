import {ArrowLeft, Send} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../../../auth/AuthContext';
import {Alert} from '../../../components/ui/Alert';
import {Button} from '../../../components/ui/Button';
import {Field} from '../../../components/ui/Field';
import {requestCategoryLabel, CONTACT_METHOD_LABELS, REQUEST_CATEGORIES} from '../../../lib/requests';
import {supabase} from '../../../lib/supabase';
import type {Experience, RequestType} from '../../../types';

interface FormState {
  type: RequestType | '';
  title: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  participants: string;
  contact_method: string;
  additional_requirements: string;
}

const INITIAL: FormState = {
  type: '',
  title: '',
  description: '',
  preferred_date: '',
  preferred_time: '',
  location: '',
  participants: '',
  contact_method: 'email',
  additional_requirements: '',
};

type Errors = Partial<Record<keyof FormState | 'form', string>>;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.type) errors.type = 'Choose a request category.';
  if (form.title.trim().length < 3) errors.title = 'Give your request a clear title (at least 3 characters).';
  if (form.description.trim().length < 10)
    errors.description = 'Tell management a little more (at least 10 characters).';
  if (form.participants && form.participants.trim().length < 2)
    errors.participants = 'List participants or write “just me”.';
  return errors;
}

export function NewRequestPage() {
  const {session} = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const me = session?.user.id ?? null;

  const experienceId = searchParams.get('experience');
  const typeParam = searchParams.get('type');

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const prefillRef = useRef(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({...prev, [key]: value}));
    setErrors((prev) => ({...prev, [key]: undefined, form: undefined}));
  };

  useEffect(() => {
    if (prefillRef.current) return;
    prefillRef.current = true;
    if (experienceId) {
      void (async () => {
        const {data, error} = await supabase
          .from('experiences')
          .select('*')
          .eq('id', experienceId)
          .maybeSingle();
        if (error) {
          setExperienceError(error.message);
          return;
        }
        if (!data) {
          setExperienceError('That experience could not be found.');
          return;
        }
        const row = data as Experience;
        setExperience(row);
        setForm((prev) => ({
          ...prev,
          type: prev.type || row.type,
          title: prev.title || row.title,
          location: prev.location || row.location || '',
        }));
      })();
    } else if (typeParam && REQUEST_CATEGORIES.some((category) => category.key === typeParam)) {
      setForm((prev) => ({...prev, type: typeParam as RequestType}));
    }
  }, [experienceId, typeParam]);

  const submit = useCallback(async () => {
    if (!me) return;
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const {data, error: insertError} = await supabase
        .from('requests')
        .insert({
          user_id: me,
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          experience_id: experienceId || null,
          preferred_date: form.preferred_date || null,
          preferred_time: form.preferred_time || null,
          location: form.location.trim() || null,
          participants: form.participants.trim() || null,
          contact_method: form.contact_method || null,
          additional_requirements: form.additional_requirements.trim() || null,
        })
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);
      navigate(`/dashboard/requests/${data.id}`, {replace: true});
    } catch (e) {
      setErrors({form: e instanceof Error ? e.message : 'Could not send your request.'});
    } finally {
      setSubmitting(false);
    }
  }, [experienceId, form, me, navigate]);

  const contactOptions = Object.entries(CONTACT_METHOD_LABELS);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-stone pb-6">
        <Link
          to="/dashboard/requests"
          className="nav-link mb-2 inline-flex min-h-11 items-center gap-1"
        >
          <ArrowLeft className="size-4" aria-hidden /> Requests
        </Link>
        <p className="eyebrow mb-2">New request</p>
        <h1 className="break-words text-2xl sm:text-3xl">Request something personal</h1>
        <p className="mt-2 text-muted">
          Tell management what you would like to explore. This is a request, not a booking —
          management reviews everything personally.
        </p>
      </div>

      {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
      {experienceError ? <Alert tone="error">{experienceError}</Alert> : null}

      {experience ? (
        <div className="surface border-l-2 border-l-gold p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Requesting experience</p>
          <p className="mt-1 font-medium text-charcoal">{experience.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {requestCategoryLabel(experience.type)} · management reviews every request personally
          </p>
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field label="Category" error={errors.type}>
          {({id, 'aria-describedby': describedBy}) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className="field-input min-h-11 text-[16px] sm:text-sm"
              value={form.type}
              onChange={(event) => set('type', event.target.value as RequestType | '')}
            >
              <option value="">Select a category…</option>
              {REQUEST_CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Title" error={errors.title} hint="A short summary of what you are asking for.">
          {({id, 'aria-describedby': describedBy}) => (
            <input
              id={id}
              aria-describedby={describedBy}
              className="field-input min-h-11 text-[16px] sm:text-sm"
              value={form.title}
              placeholder="A handwritten note for a birthday"
              onChange={(event) => set('title', event.target.value)}
            />
          )}
        </Field>

        <Field label="Description" error={errors.description} hint="What do you have in mind? Include any context that helps management understand.">
          {({id, 'aria-describedby': describedBy}) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              className="field-input min-h-32 resize-y text-[16px] sm:text-sm"
              rows={5}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Preferred date" hint="Optional.">
            {({id, 'aria-describedby': describedBy}) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="date"
                className="field-input min-h-11 text-[16px] sm:text-sm"
                value={form.preferred_date}
                onChange={(event) => set('preferred_date', event.target.value)}
              />
            )}
          </Field>
          <Field label="Preferred time" hint="Optional.">
            {({id, 'aria-describedby': describedBy}) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="time"
                className="field-input min-h-11 text-[16px] sm:text-sm"
                value={form.preferred_time}
                onChange={(event) => set('preferred_time', event.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Location" hint="Where relevant — a city, venue or “online”.">
            {({id, 'aria-describedby': describedBy}) => (
              <input
                id={id}
                aria-describedby={describedBy}
                className="field-input min-h-11 text-[16px] sm:text-sm"
                value={form.location}
                onChange={(event) => set('location', event.target.value)}
              />
            )}
          </Field>
          <Field label="Participants" error={errors.participants} hint="Who is involved? Write “just me” if it is only you.">
            {({id, 'aria-describedby': describedBy}) => (
              <input
                id={id}
                aria-describedby={describedBy}
                className="field-input min-h-11 text-[16px] sm:text-sm"
                value={form.participants}
                onChange={(event) => set('participants', event.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="Preferred contact method" hint="How management should reach you about this request.">
          {({id, 'aria-describedby': describedBy}) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className="field-input min-h-11 text-[16px] sm:text-sm"
              value={form.contact_method}
              onChange={(event) => set('contact_method', event.target.value)}
            >
              {contactOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Additional requirements" hint="Optional. Anything else management should know.">
          {({id, 'aria-describedby': describedBy}) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              className="field-input min-h-24 resize-y text-[16px] sm:text-sm"
              rows={3}
              value={form.additional_requirements}
              onChange={(event) => set('additional_requirements', event.target.value)}
            />
          )}
        </Field>

        <div className="flex items-center justify-between gap-3 border-t border-stone pt-5">
          <p className="text-xs text-muted">Management reviews every request personally.</p>
          <div className="flex gap-2">
            <Link
              to={experienceId ? '/dashboard/experiences' : '/dashboard/requests'}
              className="btn btn-ghost"
            >
              Cancel
            </Link>
            <Button type="submit" loading={submitting}>
              <Send className="size-4" aria-hidden />
              Submit request
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
