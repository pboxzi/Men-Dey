import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import Button from '../../components/ui/Button';
import { TextAreaField, TextField } from '../../components/ui/Field';

export default function FanProfilePage() {
  const { profile, user, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [favoriteMovie, setFavoriteMovie] = useState(profile?.favorite_movie ?? '');
  const [contact, setContact] = useState(profile?.contact ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please enter a name.';
    setErrors(next);
    setFormError(null);
    setSaved(false);
    if (Object.keys(next).length > 0) {
      document.getElementById('profile-name')?.focus();
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim(),
      country: country.trim(),
      bio: bio.trim(),
      favorite_movie: favoriteMovie.trim(),
      contact: contact.trim(),
    });
    setSaving(false);

    if (error) {
      setFormError(error);
      return;
    }
    setSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <header>
        <span className="t-meta">Fan Area</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
          Profile
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
          The details the management office sees when they respond to you.
        </p>
      </header>

      <form className="ed-card space-y-4 p-6" onSubmit={onSubmit} noValidate>
        {saved && (
          <div className="form-alert form-alert-success" role="status">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Your profile has been saved.
            </span>
          </div>
        )}
        {formError && (
          <div className="form-alert form-alert-error" role="alert">
            {formError}
          </div>
        )}

        <TextField
          id="profile-name"
          label="Name"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          invalid={Boolean(errors.name)}
        />

        <TextField
          id="profile-email"
          label="Email address"
          name="email"
          type="email"
          value={profile?.email || user?.email || ''}
          readOnly
          hint="Your sign-in email cannot be changed here. Contact the office if it needs updating."
        />

        <TextField
          id="profile-country"
          label="Country"
          name="country"
          autoComplete="country-name"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

        <TextAreaField
          id="profile-bio"
          label="A little about you"
          name="bio"
          rows={4}
          hint="Optional — a sentence or two for the office."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <TextField
          id="profile-movie"
          label="Favourite Gillian performance"
          name="favorite_movie"
          value={favoriteMovie}
          onChange={(e) => setFavoriteMovie(e.target.value)}
        />

        <TextField
          id="profile-contact"
          label="Preferred contact detail"
          name="contact"
          hint="Optional — an alternative way for management to reach you."
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" loading={saving}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
