'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/'), 500);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const trimmedName = displayName.trim();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: trimmedName || undefined,
          full_name: trimmedName || undefined,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setError('Check your email for the confirmation link!');
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setSuccess(false);
    setEmailError('');
    setPasswordError('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] overflow-y-auto">
      <div className={`max-w-md w-full bg-white rounded-[1.75rem] sm:rounded-[2.5rem] shadow-warm p-6 sm:p-8 md:p-12 my-auto transition-all duration-300 ${success ? 'opacity-90' : 'opacity-100'}`}>
        <div className="text-center mb-8 sm:mb-10">
          <img
            src="/icons/icon-192x192.png"
            alt="Shopping Memo logo"
            className="h-16 w-16 mx-auto mb-4 rounded-2xl shadow-warm ring-2 ring-gold/25"
          />
          <h1 className="text-3xl sm:text-4xl font-serif text-bark mb-2">
            {success ? 'Success!' : 'Welcome'}
          </h1>
          <p className="text-bark/60">
            {success
              ? isRegisterMode ? 'Your account has been created. Check your email to verify.' : 'You\'re logged in!'
              : isRegisterMode ? 'Create your account to get started' : 'Sign in to manage your meals'
            }
          </p>
        </div>

        {!success && (
          <form className="space-y-6" onSubmit={isRegisterMode ? handleRegister : handleLogin}>
            {isRegisterMode && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">
                  Display name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full bg-hemp/10 border border-hemp/30 rounded-2xl py-4 pl-12 pr-4 text-bark focus:ring-2 focus:ring-sage/20 focus:border-transparent transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    aria-label="Display name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`w-full bg-hemp/10 border rounded-2xl py-4 pl-12 pr-4 text-bark focus:ring-2 focus:border-transparent transition-all ${
                    emailError ? 'border-red-300 focus:ring-red-300/30' : 'border-hemp/30 focus:ring-sage/20'
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  aria-label="Email address"
                  aria-invalid={!!emailError}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 px-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full bg-hemp/10 border rounded-2xl py-4 pl-12 pr-12 text-bark focus:ring-2 focus:border-transparent transition-all ${
                    passwordError ? 'border-red-300 focus:ring-red-300/30' : 'border-hemp/30 focus:ring-sage/20'
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  aria-label="Password"
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-bark/40 hover:text-bark transition-colors p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-sage/30 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 px-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {passwordError}
                </p>
              )}
            </div>

            {!isRegisterMode && (
              <div className="text-right px-2">
                <Link
                  href="/reset-password"
                  className="text-xs font-medium text-sage-deep hover:underline focus:outline-none focus:ring-2 focus:ring-sage/30 rounded px-2 py-1"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div
                className={`p-4 rounded-2xl text-sm text-center flex items-center gap-2 justify-center ${
                  error.includes('Check your email')
                    ? 'bg-sage/10 text-sage-deep'
                    : 'bg-red-50 text-red-500'
                }`}
                role="alert"
              >
                {error.includes('Check your email') ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft hover:bg-sage-deep disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px] focus:outline-none focus:ring-2 focus:ring-sage/30"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isRegisterMode ? 'Create Account' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleModeToggle}
                disabled={loading}
                className="w-full py-4 bg-cream text-bark border border-bark/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-hemp/10 disabled:opacity-50 transition-all flex items-center justify-center touch-manipulation focus:outline-none focus:ring-2 focus:ring-bark/30"
              >
                {isRegisterMode ? 'Already have an account? Sign in' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {success && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
