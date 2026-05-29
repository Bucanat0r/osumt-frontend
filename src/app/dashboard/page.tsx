'use client';

import React, { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState('Staff');

  useEffect(() => {
    const role = getCookie('user_role');
    if (role) {
      setUserRole(role as string);
    }
  }, []);

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

        <div className="space-y-3 pt-2">
          <Link
            href="/waybills"
            className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-950 flex items-center justify-center gap-2"
          >
            <ClipboardList className="h-4 w-4" /> Go to Waybill Registration Desk
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-red-200 text-red-600 py-3 text-sm font-bold transition-colors hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
