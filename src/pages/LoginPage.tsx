import { useEffect, useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { AppRoute } from '../types/campus';
import { validateLoginInput } from '../utils/validation';

interface LoginPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { profile: activeProfile, loginWithGoogle, loginWithEmail, sendResetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Redirect already-authenticated sessions to their respective dashboards
  useEffect(() => {
    if (activeProfile) {
      onNavigate(activeProfile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    }
  }, [activeProfile, onNavigate]);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    try {
      const profile = await loginWithGoogle();
      if (!profile) {
        // Redirect fallback initiated
        return;
      }
      showToast(`Welcome back, ${profile.fullName}.`, 'success');
      onNavigate(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const profile = await loginWithEmail(email, password);
      showToast(`Signed in as ${profile.fullName}.`, 'success');
      onNavigate(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email address above first to receive a password reset link.');
      return;
    }
    try {
      await sendResetPassword(email);
      setResetSent(true);
      showToast('Password reset link sent to your email.', 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send password reset email.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Sign in to CampusTrace</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access your student, faculty, or campus administrator workspace.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {resetSent && (
          <div role="status" className="mb-5 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            Password reset instructions have been sent to {email}.
          </div>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or sign in with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEmailSignIn} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          New to CampusTrace?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-medium text-blue-700 hover:text-blue-800"
          >
            Register an account
          </button>
        </p>
      </div>
    </div>
  );
}
