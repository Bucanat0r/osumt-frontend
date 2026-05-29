'use client';

import React from 'react';
import { getCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const userRole = getCookie('user_role') || 'Staff';

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('user_role');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-slate-100 text-center space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
          OSUMT Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Welcome to the Portal! You are logged in as a <span className="font-semibold text-blue-600">{userRole}</span>.
        </p>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
