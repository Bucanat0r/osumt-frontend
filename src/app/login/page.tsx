'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { setCookie } from 'cookies-next';
import { ShieldAlert, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Connect to your NestJS backend API
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        pass: password, // Maps to 'pass' parameter in NestJS controller
      });

      const { access_token, user } = response.data;

      // Save token securely in user session cookies (expires in 1 day)
      setCookie('token', access_token, { maxAge: 60 * 60 * 24 });
      setCookie('user_role', user.role, { maxAge: 60 * 60 * 24 });

      // Forward to portal area
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg border border-slate-100">
        
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
            OSUMT <span className="text-red-600">GO</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Digital Waybill & Transport Management Portal
          </p>
        </div>

        {/* Error Flag Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600 border border-red-100">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@osumt.com"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:bg-slate-300"
          >
            {loading ? 'Authenticating Profile...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
