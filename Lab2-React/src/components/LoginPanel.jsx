import { useState } from 'react';

export default function LoginPanel({ onLogin, error }) {
  const [email, setEmail] = useState('patient@gmail.com');
  const [password, setPassword] = useState('Password123');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onLogin(email, password);
    setBusy(false);
  };

  return (
    <form className="panel login" onSubmit={submit}>
      <h2 className="panel-title">Sign in to NexCare</h2>
      <p className="panel-sub">
        Booking needs a patient session. Seed accounts all use the password
        <code> Password123</code>.
      </p>

      <label className="field">
        <span className="field-label">Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p className="alert error">{error}</p>}

      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="muted tiny" style={{ marginTop: 14 }}>
        Skip this to browse the bundled hospital catalogue offline — the wizard
        still works, but bookings are not saved to the server.
      </p>
    </form>
  );
}
