'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/server-actions';
import Link from 'next/link';

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const redirectTo = searchParams.get('redirect') || '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('redirect_to', redirectTo);
      await signIn(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {justRegistered && (
        <div className="mb-md p-sm bg-success-container text-on-success-container rounded-lg text-body-md border border-success/20">
          Account created! Check your email to confirm, then sign in below.
        </div>
      )}

      {error && (
        <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg text-body-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-md">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <div>
          <label htmlFor="email" className="block text-label-caps text-secondary uppercase mb-xs">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-label-caps text-secondary uppercase mb-xs">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary font-medium py-sm rounded-md hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-body-md text-secondary mt-xl">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
        <div className="text-center mb-xl">
          <div className="w-12 h-12 rounded bg-primary text-on-primary flex items-center justify-center mx-auto mb-md font-bold text-xl">
            N
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Nengi's Precision Ledger</h1>
          <p className="text-body-md text-secondary mt-xs">Sign in to your account</p>
        </div>

        <Suspense fallback={<div className="text-center text-secondary py-lg">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
