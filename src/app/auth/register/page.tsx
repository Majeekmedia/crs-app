'use client';

import { useState } from 'react';
import { signUp } from '@/lib/server-actions';
import Link from 'next/link';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await signUp(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
        <div className="text-center mb-xl">
          <div className="w-12 h-12 rounded bg-primary text-on-primary flex items-center justify-center mx-auto mb-md font-bold text-xl">
            N
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Create Account</h1>
          <p className="text-body-md text-secondary mt-xs">Register as a new admin</p>
        </div>

        {error && (
          <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg text-body-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label htmlFor="name" className="block text-label-caps text-secondary uppercase mb-xs">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Admin User"
            />
          </div>
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
              minLength={6}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-medium py-sm rounded-md hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-body-md text-secondary mt-xl">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
