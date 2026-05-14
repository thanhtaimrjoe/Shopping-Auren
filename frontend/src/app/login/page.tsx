'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setError('Check your email for the confirmation link!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-warm p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-bark mb-2">Welcome</h1>
          <p className="text-bark/60">Sign in to manage your culinary rhythm</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">Email</label>
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

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-bark/40 px-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-bark/20" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-hemp/10 border-0 rounded-2xl py-4 pl-12 pr-4 text-bark focus:ring-2 focus:ring-sage/20 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft hover:bg-sage-deep transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-4 bg-cream text-bark border border-bark/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-hemp/10 transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
