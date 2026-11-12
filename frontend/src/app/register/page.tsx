'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { UserRole, Department } from '@/types';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('INTERNAL_TEAM');
  const [department, setDepartment] = useState<Department>('FRONTEND');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const registerMutation = useRegister();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        role,
        department: role === 'INTERNAL_TEAM' ? department : null,
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            NodeWave
          </h1>
          <p className="text-sm text-gray-500">
            Create your team workspace account
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <Input
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="name@nodewave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                >
                  <option value="INTERNAL_TEAM">Internal Team</option>
                  <option value="PM">Product Manager</option>
                  <option value="CLIENT_GUEST">Client Guest</option>
                </select>
              </div>

              {role === 'INTERNAL_TEAM' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <select
                    value={department || ''}
                    onChange={(e) => setDepartment((e.target.value as Department) || null)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
                  >
                    <option value="UI_UX">UI/UX</option>
                    <option value="FRONTEND">Frontend</option>
                    <option value="BACKEND">Backend</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full mt-2"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <span className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
