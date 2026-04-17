import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuth } from '@/lib/AuthContext';

// ─── Google SVG Icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ─── Eye Icon ─────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

// ─── Inline CSS ───────────────────────────────────────────────────────────────
const styles = `
  .pv-auth-root {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    font-family: 'Inter', sans-serif;
    color: #0f0f0f;
  }

  /* ── Left ─────────────────────────────────────────────── */
  .pv-left {
    flex: 0 0 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 72px 80px 80px;
    border-right: 1px solid #e5e7eb;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .pv-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 40px;
  }

  .pv-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(64px, 8vw, 96px);
    font-weight: 700;
    line-height: 0.85;
    letter-spacing: -0.05em;
    color: #0f0f0f;
    margin: 0 0 32px -4px;
    display: block;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  .pv-subtext {
    font-size: 16px;
    line-height: 1.6;
    color: #6b7280;
    max-width: 380px;
    margin: 0;
  }

  .pv-footer-links {
    margin-top: auto;
    padding-top: 80px;
    display: flex;
    gap: 24px;
  }

  .pv-footer-links a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #9ca3af;
    text-decoration: none;
    letter-spacing: 0.08em;
    transition: color 150ms ease;
  }

  .pv-footer-links a:hover {
    color: #0f0f0f;
  }

  /* ── Right ────────────────────────────────────────────── */
  .pv-right {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 64px 80px 64px;
    min-height: 100vh;
    box-sizing: border-box;
  }

  /* ── Toggle ───────────────────────────────────────────── */
  .pv-toggle {
    display: flex;
    gap: 28px;
    margin-bottom: 48px;
  }

  .pv-toggle-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: #9ca3af;
    background: none;
    border: none;
    padding: 0 0 6px 0;
    cursor: pointer;
    position: relative;
    transition: color 200ms ease;
    border-bottom: 2px solid transparent;
  }

  .pv-toggle-btn.active {
    color: #0f0f0f;
    border-bottom: 2px solid #0f0f0f;
  }

  .pv-toggle-btn:hover:not(.active) {
    color: #374151;
  }

  /* ── Fields ───────────────────────────────────────────── */
  .pv-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .pv-field-wrap {
    position: relative;
  }

  .pv-input {
    width: 100%;
    padding: 12px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #0f0f0f;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 0;
    outline: none;
    transition: border-color 200ms ease;
    box-sizing: border-box;
  }

  .pv-input::placeholder {
    color: #9ca3af;
  }

  .pv-input:focus {
    border-color: #374151;
  }

  .pv-input.error {
    border-color: #dc2626;
  }

  .pv-input-pw {
    padding-right: 48px;
  }

  .pv-eye-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    transition: color 150ms ease;
  }

  .pv-eye-btn:hover {
    color: #374151;
  }

  .pv-error-msg {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #dc2626;
    margin-top: 6px;
    letter-spacing: 0.04em;
  }

  /* ── Buttons ──────────────────────────────────────────── */
  .pv-btn-primary {
    width: 100%;
    padding: 13px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #0f0f0f;
    background: transparent;
    border: 1px solid #0f0f0f;
    border-radius: 0;
    cursor: pointer;
    transition: background 200ms ease, color 200ms ease;
    margin-bottom: 24px;
  }

  .pv-btn-primary:hover:not(:disabled) {
    background: #0f0f0f;
    color: #ffffff;
  }

  .pv-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── OR divider ───────────────────────────────────────── */
  .pv-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .pv-divider-line {
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .pv-divider-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #9ca3af;
  }

  /* ── Google btn ───────────────────────────────────────── */
  .pv-btn-google {
    width: 100%;
    padding: 12px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: #0f0f0f;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: border-color 200ms ease, background 200ms ease;
  }

  .pv-btn-google:hover {
    border-color: #374151;
    background: #fafafa;
  }

  /* ── Field-slide animation ────────────────────────────── */
  .pv-field-animate {
    animation: pvSlideIn 200ms ease forwards;
  }

  @keyframes pvSlideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Mobile ───────────────────────────────────────────── */
  @media (max-width: 768px) {
    .pv-auth-root { flex-direction: column; }

    .pv-left {
      flex: 0 0 auto;
      min-height: auto;
      padding: 56px 28px 40px;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .pv-display { font-size: clamp(52px, 14vw, 72px); }

    .pv-right {
      flex: 0 0 auto;
      min-height: auto;
      padding: 44px 28px 56px;
    }

    .pv-footer-links { padding-top: 40px; }
  }

  @media (max-width: 480px) {
    .pv-display { font-size: 48px; }
    .pv-left { padding: 44px 24px 32px; }
    .pv-right { padding: 36px 24px 44px; }
  }
`;

// ─── Types (JSDoc — file is .jsx, not .tsx) ──────────────────────────────────
/**
 * @typedef {{ email: string, password: string, username: string, fullName: string }} AuthFields
 * @typedef {{ email?: string, password?: string, username?: string, fullName?: string }} AuthErrors
 */

// ─── Component ────────────────────────────────────────────────────────────────
export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState(/** @type {AuthFields} */({ email: '', password: '', username: '', fullName: '' }));
  const [errors, setErrors] = useState(/** @type {AuthErrors} */({}));
  const usernameRef = useRef(null);

  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      const redirectPath = localStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterAuth');
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  if (!isLoadingAuth && isAuthenticated) return null;

  // Inject styles once
  useEffect(() => {
    const id = 'pv-auth-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = styles;
      document.head.appendChild(el);
    }
    return () => {
      // leave styles for re-renders; remove only on unmount
    };
  }, []);

  const handleToggle = (m) => {
    setMode(m);
    setErrors({});
    setShowPw(false);
  };

  const validate = () => {
    const e = {};
    if (!fields.email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email.';
    if (!fields.password) e.password = 'Password is required.';
    else if (fields.password.length < 6) e.password = 'Min. 6 characters.';
    
    if (mode === 'signup') {
      if (!fields.username.trim()) e.username = 'Username is required.';
      if (!fields.fullName.trim()) e.fullName = 'Full Name is required.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await authService.signup(fields.email, fields.password, fields.username.trim(), fields.fullName.trim());
        if (res?.user) {
          const redirectPath = localStorage.getItem('redirectAfterAuth');
          if (redirectPath) {
            localStorage.removeItem('redirectAfterAuth');
            setTimeout(() => navigate(redirectPath, { replace: true }), 100);
          } else {
            navigate('/');
          }
        }
      } else {
        const res = await authService.login(fields.email, fields.password);
        if (res?.user) {
          const redirectPath = localStorage.getItem('redirectAfterAuth');
          if (redirectPath) {
            localStorage.removeItem('redirectAfterAuth');
            setTimeout(() => navigate(redirectPath, { replace: true }), 100);
          } else {
            navigate('/');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrors({ email: err.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await authService.loginWithGoogle();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  /**
   * @param {keyof AuthFields} key
   * @returns {(e: React.ChangeEvent<HTMLInputElement>) => void}
   */
  const handleChange = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
  };

  return (
    <div className="pv-auth-root" role="main">
      {/* ── Left: Branding ──────────────────────────────── */}
      <aside className="pv-left" aria-label="PromptVault branding">
        <p className="pv-eyebrow">promptvault.dev</p>

        <h1 className="pv-display" aria-label="PromptVault">
          Prompt<br />Vault
        </h1>

        <p className="pv-subtext">
          A curated library of reusable prompts.<br />
          Click any block to copy it instantly.
        </p>

        <nav className="pv-footer-links" aria-label="Footer">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </nav>
      </aside>

      {/* ── Right: Auth Form ────────────────────────────── */}
      <section className="pv-right" aria-label="Authentication form">
        {/* Toggle */}
        <div className="pv-toggle" role="tablist" aria-label="Auth mode">
          <button
            id="auth-login-tab"
            role="tab"
            aria-selected={mode === 'login'}
            className={`pv-toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleToggle('login')}
          >
            Login
          </button>
          <button
            id="auth-signup-tab"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`pv-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleToggle('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-label={mode === 'login' ? 'Login form' : 'Sign up form'}>
          <div className="pv-fields">
            {/* Full Name & Username — Sign Up only */}
            {mode === 'signup' && (
              <>
                <div className="pv-field-wrap pv-field-animate">
                  <input
                    id="auth-fullname"
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={fields.fullName}
                    onChange={handleChange('fullName')}
                    className={`pv-input${errors.fullName ? ' error' : ''}`}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'auth-fullname-error' : undefined}
                    disabled={loading}
                    autoFocus
                  />
                  {errors.fullName && (
                    <p id="auth-fullname-error" className="pv-error-msg" role="alert">{errors.fullName}</p>
                  )}
                </div>

                <div className="pv-field-wrap pv-field-animate">
                  <input
                    ref={usernameRef}
                    id="auth-username"
                    type="text"
                    autoComplete="username"
                    placeholder="Username"
                    value={fields.username}
                    onChange={handleChange('username')}
                    className={`pv-input${errors.username ? ' error' : ''}`}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? 'auth-username-error' : undefined}
                    disabled={loading}
                  />
                  {errors.username && (
                    <p id="auth-username-error" className="pv-error-msg" role="alert">{errors.username}</p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div className="pv-field-wrap">
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={fields.email}
                onChange={handleChange('email')}
                className={`pv-input${errors.email ? ' error' : ''}`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                disabled={loading}
              />
              {errors.email && (
                <p id="auth-email-error" className="pv-error-msg" role="alert">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="pv-field-wrap">
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Password"
                value={fields.password}
                onChange={handleChange('password')}
                className={`pv-input pv-input-pw${errors.password ? ' error' : ''}`}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'auth-pw-error' : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="pv-eye-btn"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPw} />
              </button>
              {errors.password && (
                <p id="auth-pw-error" className="pv-error-msg" role="alert">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Primary CTA */}
          <button
            id="auth-submit-btn"
            type="submit"
            className="pv-btn-primary"
            disabled={loading}
            aria-live="polite"
          >
            {loading ? 'LOADING...' : 'CONTINUE'}
          </button>

          {/* OR divider */}
          <div className="pv-divider" aria-hidden="true">
            <div className="pv-divider-line" />
            <span className="pv-divider-text">OR</span>
            <div className="pv-divider-line" />
          </div>

          {/* Google */}
          <button
            id="auth-google-btn"
            type="button"
            className="pv-btn-google"
            disabled={loading}
            onClick={handleGoogleLogin}
            aria-label="Continue with Google"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>
      </section>
    </div>
  );
}
