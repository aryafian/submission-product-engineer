'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isClient = user?.role === 'CLIENT_GUEST';

  const internalNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const clientNav = [
    { href: '/client/projects', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const navItems = isClient ? clientNav : internalNav;

  const isActive = (item: { href: string }) => {
    if (item.href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/projects');
    }
    if (item.href === '/client/projects') {
      return pathname.startsWith('/client');
    }
    return pathname === item.href;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-gray-200 bg-[#FAFBFC]">
      {/* Brand Header (without green N icon) */}
      <div className="px-5 py-5">
        <span className="text-base font-bold tracking-tight text-gray-900">NodeWave</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'PM' ? 'Product Manager' : user.role === 'CLIENT_GUEST' ? 'Client' : user.department?.replace('_', '/') || 'Team'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

// Keep the Navbar export for backward compatibility
export function Navbar() {
  return <Sidebar />;
}
