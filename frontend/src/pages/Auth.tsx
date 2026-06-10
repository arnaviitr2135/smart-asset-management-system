import React, { useEffect, useState } from 'react';
import { buildApiUrl, useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, Shield, Database, Sparkles, ArrowRight } from 'lucide-react';

const Auth: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'auth' | 'forgot' | 'reset'>('auth');
  const [resetToken, setResetToken] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const parseAuthResponse = async (response: Response, fallbackMessage: string) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const body = await response.text().catch(() => '');
    if (response.status === 404 && body.includes('Cannot POST')) {
      throw new Error('Password reset is not active on the backend yet. Please deploy the latest Render backend commit and try again.');
    }

    if (!response.ok) {
      throw new Error(fallbackMessage);
    }

    return {};
  };

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('resetToken');
    if (token) {
      setResetToken(token);
      setIsLogin(true);
      setAuthMode('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const path = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = isLogin
      ? { email, password }
      : { email, password, fullName, role: isAdmin ? 'ADMIN' : 'USER' };

    try {
      const response = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await parseAuthResponse(response, 'Authentication failed');

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/v1/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await parseAuthResponse(response, 'Failed to send reset link');
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }
      setSuccess(data.message || 'If an account exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/v1/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await parseAuthResponse(response, 'Failed to reset password');
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(data.message || 'Password reset successfully. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      setAuthMode('auth');
      setIsLogin(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMode = (mode: 'auth' | 'forgot' | 'reset') => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center relative px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:46px_46px] opacity-35"></div>
        <div className="absolute left-0 top-0 h-72 w-full bg-gradient-to-b from-teal-500/12 to-transparent"></div>
      </div>

      <div className="w-full max-w-5xl z-10 animate-fade-in grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-center">
        <div className="hidden lg:block">
          <div className="page-kicker mb-4">Cultural Council IIT Roorkee</div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
            Resource loans without spreadsheet chaos.
          </h1>
          <p className="mt-4 text-base text-dark-300 max-w-xl leading-relaxed">
            CultTrack AI brings shared inventory, issue desks, QR check-ins, demand forecasting, and audit trails into one polished operations cockpit.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
            {['AI demand signals', 'QR check-in desk', 'Admin audit trail'].map((item) => (
              <div key={item} className="glass-panel p-4 rounded-xl border border-white/10">
                <Sparkles className="w-4 h-4 text-teal-300 mb-3" />
                <p className="text-xs font-semibold text-dark-200 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex p-3 bg-gradient-to-tr from-teal-400 via-brand-500 to-indigo-500 rounded-2xl shadow-xl shadow-teal-500/20 mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-dark-100 to-teal-300 bg-clip-text text-transparent font-sans">
              CultTrack AI
            </h1>
            <p className="text-xs text-dark-400 uppercase tracking-widest mt-1">
              Smart Asset Management Platform
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative surface-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="hidden lg:flex p-2.5 bg-gradient-to-tr from-teal-400 via-brand-500 to-indigo-500 rounded-xl shadow-xl shadow-teal-500/20">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="page-kicker">
                  {authMode === 'forgot'
                    ? 'Account recovery'
                    : authMode === 'reset'
                    ? 'Set new password'
                    : isLogin
                    ? 'Secure sign in'
                    : 'New workspace access'}
                </p>
                <h2 className="text-xl font-bold font-sans">
                  {authMode === 'forgot'
                    ? 'Reset your password'
                    : authMode === 'reset'
                    ? 'Choose a new password'
                    : isLogin
                    ? 'Welcome back'
                    : 'Create society account'}
                </h2>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium">
                {success}
              </div>
            )}

            <form
              onSubmit={
                authMode === 'forgot'
                  ? handleForgotPassword
                  : authMode === 'reset'
                  ? handleResetPassword
                  : handleSubmit
              }
              className="space-y-4"
            >
              {!isLogin && authMode === 'auth' && (
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-sm"
                    />
                  </div>
                </div>
              )}

              {authMode !== 'reset' && (
                <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">IITR Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-dark-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. member@culttrack.in"
                    className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-sm"
                  />
                </div>
                </div>
              )}

              {authMode !== 'forgot' && (
                <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-dark-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-sm"
                  />
                </div>
                </div>
              )}

              {authMode === 'reset' && (
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-dark-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-sm"
                    />
                  </div>
                </div>
              )}

              {!isLogin && authMode === 'auth' && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-teal-400/20 bg-teal-400/5 mt-2">
                  <span className="text-xs text-teal-300 flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5" /> Register as Council Admin?
                  </span>
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="rounded border-dark-700 bg-dark-900 text-teal-500 focus:ring-teal-500 w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg font-semibold text-sm btn-primary mt-4 disabled:opacity-50 text-white"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {authMode === 'forgot'
                      ? 'Send Reset Link'
                      : authMode === 'reset'
                      ? 'Update Password'
                      : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {authMode === 'auth' && isLogin && (
                <button
                  onClick={() => switchAuthMode('forgot')}
                  className="block mx-auto text-xs text-dark-300 hover:text-teal-200 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              )}
              <button
                onClick={() => {
                  if (authMode !== 'auth') {
                    switchAuthMode('auth');
                    setIsLogin(true);
                    return;
                  }
                  setError('');
                  setSuccess('');
                  setIsLogin(!isLogin);
                }}
                className="text-xs text-teal-300 hover:text-teal-200 hover:underline transition-colors"
              >
                {authMode === 'auth'
                  ? isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'
                  : 'Back to sign in'}
              </button>
            </div>
          </div>

          {isLogin && authMode === 'auth' && (
            <div className="mt-4 p-4 rounded-xl border border-white/10 glass-panel text-xs text-dark-300 flex flex-col gap-2">
              <span className="font-semibold text-teal-300 uppercase tracking-wider text-[10px]">Demo credentials (seeded):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-medium text-dark-100 block">Admin Account:</span>
                  <code>admin@culttrack.in</code> / <code>password123</code>
                </div>
                <div className="sm:border-l border-dark-800/60 sm:pl-3">
                  <span className="font-medium text-dark-100 block">Member Account:</span>
                  <code>member@culttrack.in</code> / <code>password123</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
