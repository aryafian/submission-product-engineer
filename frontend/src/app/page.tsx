'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login');
    } else if (user.role === 'CLIENT_GUEST') {
      router.replace('/client/projects');
    } else {
      router.replace('/dashboard');
    }
  }, [user, token, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="text-xs text-gray-400 font-medium">Loading workspace...</p>
      </div>
    </div>
  );
}
