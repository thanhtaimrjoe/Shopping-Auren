'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Check your email for a password reset link.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cream p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-[1.75rem] sm:rounded-[2.5rem] shadow-warm p-6 sm:p-8 md:p-12 my-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-bark/50 hover:text-sage-deep text-sm mb-8 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif text-bark mb-2">Reset password</h1>
          <p className="text-bark/60">We will email you a secure reset link</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark focus:ring-2 focus:ring-sage/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm text-center">{error}</div>
          )}
          {message && (
            <div className="p-4 bg-sage/10 text-sage-deep rounded-2xl text-sm text-center">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft hover:bg-sage-deep transition-all flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
