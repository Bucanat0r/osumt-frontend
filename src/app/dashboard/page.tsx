'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteCookie } from 'cookies-next';
import { TrendingUp, AlertTriangle, Landmark, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/admin/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Error parsing dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('user_role');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing Operational Ledgers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Dashboard Title Header bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tight">Executive Control Tower</h1>
            <p className="text-sm text-slate-500 font-medium">Real-time revenue monitoring and automated risk flagging.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/waybills" className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 border shadow-sm hover:bg-slate-100 transition-all">
              Waybills Desk
            </Link>
            <Link href="/finance" className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 border shadow-sm hover:bg-slate-100 transition-all">
              Finance Desk
            </Link>
            <button onClick={handleLogout} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-100 transition-all flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Logout
            </button>
            <button onClick={fetchDashboardMetrics} className="rounded-lg bg-white p-2 text-slate-600 border shadow-sm hover:bg-slate-100 transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* High-Level Overview Grid Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Gross Revenue</span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">₦{data.cards.grossSales.toLocaleString()}</p>
          </div>

          <div className="rounded-xl bg-white p-5 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Depot Field Expenses</span>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">₦{data.cards.expenses.toLocaleString()}</p>
          </div>

          <div className="rounded-xl bg-white p-5 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Expected Bank Slip Total</span>
              <Landmark className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-900">₦{data.cards.expectedBank.toLocaleString()}</p>
          </div>

          <div className="rounded-xl bg-white p-5 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Net Bank Variance Delta</span>
              <ShieldCheck className={`h-5 w-5 ${data.cards.netDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <p className={`text-2xl font-extrabold ${data.cards.netDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₦{data.cards.netDelta.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Automated System Red Flags Listing */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
            Automated Audit Flags & Anomalies ({data.flags.length})
          </h2>

          {data.flags.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 font-medium">All systems green. No financial leakage anomalies detected across active channels.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.flags.map((flag: any, index: number) => (
                <div key={index} className="flex items-start justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      flag.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {flag.type}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{flag.description}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">{flag.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
