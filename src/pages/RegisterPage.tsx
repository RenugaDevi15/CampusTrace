import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { AppRoute } from '../types/campus';
import { validateRegistrationInput } from '../utils/validation';

interface RegisterPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [department, setDepartment] = useState('');
  const [campusId, setCampusId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleRegister = async () => {
    setSubmitting(true);
    setServerError(null);
    try {
      const profile = await loginWithGoogle({
        fullName: fullName.trim() || undefined,
        role,
        department: department.trim() || 'General Studies',
        campusId: campusId.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (!profile) {
        // Redirect flow initiated
        return;
      }
      showToast(`Account ready! Signed in as ${profile.fullName}.`, 'success');
      onNavigate(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setServerError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateRegistrationInput({
      fullName,
      email,
      password,
      confirmPassword,
      role,
      department,
      campusId,
      phone,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      showToast('Please correct the highlighted registration fields.', 'error');
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const profile = await registerWithEmail(email, password, {
        fullName,
        role,
        department,
        campusId,
        phone,
      });
      showToast(`Registration successful! Welcome, ${profile.fullName}.`, 'success');
      onNavigate(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create CampusTrace Account</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Register as a Student or Faculty member to report items and verify claims.
          </p>
        </div>

        {serverError && (
          <div role="alert" className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
            {serverError}
          </div>
        )}

        {/* Role Selector */}
        <div className="mb-5">
          <span className="block text-xs font-medium text-slate-700 mb-2">Campus Role</span>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                role === 'student' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('faculty')}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                role === 'faculty' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Member
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleRegister}
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
          Continue with Google ({role === 'student' ? 'Student' : 'Faculty'})
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or register with email &amp; password</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="reg-campus-id" className="block text-xs font-medium text-slate-700 mb-1">
                {role === 'student' ? 'Student ID *' : 'Faculty / Staff ID *'}
              </label>
              <input
                id="reg-campus-id"
                type="text"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                placeholder={role === 'student' ? 'e.g. STU-2026-041' : 'e.g. FAC-CS-108'}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.campusId && <p className="mt-1 text-xs text-red-600">{errors.campusId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-department" className="block text-xs font-medium text-slate-700 mb-1">
                Department *
              </label>
              <input
                id="reg-department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number (optional)
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-slate-700 mb-1">
              University Email *
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-slate-700 mb-1">
                Password * (letters + numbers)
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-medium text-blue-700 hover:text-blue-800"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
