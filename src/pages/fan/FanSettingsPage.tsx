import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';

export default function FanSettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = 'Please use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Both passwords must match.';
    setErrors(next);
    setFormError(null);
    setSaved(false);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.password ? 'settings-password' : 'settings-confirm')?.focus();
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setPassword('');
    setConfirm('');
    setSaved(true);
  };

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-8">
      <header>
        <span className="t-meta">Fan Area</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
          Settings
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
          Security for your account. Signed in as {user?.email}.
        </p>
      </header>

      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="t-h2" style={{ fontSize: '1.3rem' }}>
          Change password
        </h2>
        <hr className="ed-rule-accent mt-3" />

        <form className="ed-card mt-5 space-y-4 p-6" onSubmit={changePassword} noValidate>
          {saved && (
            <div className="form-alert form-alert-success" role="status">
              Your password has been updated.
            </div>
          )}
          {formError && (
            <div className="form-alert form-alert-error" role="alert">
              {formError}
            </div>
          )}

          <TextField
            id="settings-password"
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            invalid={Boolean(errors.password)}
          />

          <TextField
            id="settings-confirm"
            label="Confirm new password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            invalid={Boolean(errors.confirm)}
          />

          <div>
            <Button type="submit" variant="primary" loading={saving}>
              Update Password
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="session-heading">
        <h2 id="session-heading" className="t-h2" style={{ fontSize: '1.3rem' }}>
          Session
        </h2>
        <hr className="ed-rule-accent mt-3" />

        <div className="ed-card mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="t-h3">Sign out</h3>
            <p className="t-body-sm mt-1" style={{ color: 'var(--ed-muted)' }}>
              Ends your session on this device. You will need your password to sign back in.
            </p>
          </div>
          <Button variant="secondary" onClick={onSignOut} loading={signingOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </section>
    </div>
  );
}
