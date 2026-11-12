'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Invalid credentials');
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    loginMutation.mutate({ email: quickEmail, password: 'password123' });
  };

  const seededUsers = [
    { role: 'Product Manager', email: 'pm@nodewave.com', badge: 'PM', desc: 'Full CRUD, dependencies' },
    { role: 'UI/UX Designer', email: 'uiux@nodewave.com', badge: 'UI/UX', desc: 'Project Alpha' },
    { role: 'Frontend Eng.', email: 'frontend@nodewave.com', badge: 'FE', desc: 'Blocked on Task C' },
    { role: 'Backend Eng.', email: 'backend@nodewave.com', badge: 'BE', desc: 'Alpha & Beta' },
    { role: 'Client One (Alpha)', email: 'client1@nodewave.com', badge: 'Client', desc: 'Masked Alpha metrics' },
    { role: 'Client Two (Beta)', email: 'client2@nodewave.com', badge: 'Client', desc: 'Masked Beta metrics' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            NodeWave
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to your deliverables workspace
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <Input
                type="email"
                placeholder="name@nodewave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Login */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Quick Access (Reviewer)
              </span>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                password123
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {seededUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  disabled={loginMutation.isPending}
                  className="flex flex-col text-left p-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-medium text-gray-900 text-xs truncate">{u.role}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{u.badge}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 truncate mt-0.5">{u.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
