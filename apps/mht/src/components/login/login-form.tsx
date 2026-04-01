'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTButton } from '@/components/ui/mht-button';
import { MHTLogo } from '@/components/ui/mht-logo';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        setError('Authentication service is not configured. Please contact support.');
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      // TODO: Redirect to subscriber dashboard after login
      window.location.href = '/';
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many login attempts. Please try again later.');
          break;
        default:
          setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8 sm:p-10" id="login-form">
      {/* Header */}
      <div className="text-center mb-8">
        <MHTLogo className="h-12 w-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Subscriber Portal</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Sign in to manage your MHT services
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 mb-6">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="subscriber@example.com"
            className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-11 px-4 pr-11 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Forgot Password?
          </button>
        </div>

        <MHTButton
          type="submit"
          variant="blue"
          size="lg"
          className="w-full"
          disabled={loading}
          id="login-submit"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </MHTButton>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <a href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
          Contact Support
        </a>
      </p>
    </GlassCard>
  );
}
