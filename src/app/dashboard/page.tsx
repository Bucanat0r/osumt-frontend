'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteCookie, getCookie } from 'cookies-next';
import { TrendingUp, AlertTriangle, Landmark, ShieldCheck, RefreshCw, LogOut, X, CheckCircle, Scale } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // Flag Modal State
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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
    const role = getCookie('user_role');
    if (!role) {
      router.push('/login');
      return;
    }
    const roleStr = role as string;
    setUserRole(roleStr);

    const isCEO = roleStr.includes('CEO') || roleStr.includes('Super Admin');
    const isClerkOrFinance = roleStr.includes('Clerk') || roleStr.includes('Finance');

    if (!isCEO && !isClerkOrFinance) {
      router.push('/waybills');
      return;
    }

    fetchDashboardMetrics();
  }, []);

  const handleLogout = () => {
    deleteCookie('token');
    deleteCookie('user_role');
    router.push('/login');
  };

  const handleFlagClick = async (flag: any) => {
    setSelectedFlag(flag);
    setModalData(null);
    setModalError('');
    setModalLoading(true);
    try {
      let endpoint = '';
      if (flag.type === 'Bank Delta Mismatch') {
        endpoint = `http://localhost:3000/finance/daily-sales/${flag.id}`;
      } else {
        endpoint = `http://localhost:3000/waybills/${flag.id}`;
      }
      const response = await axios.get(endpoint);
      setModalData(response.data);
    } catch (err) {
      setModalError('Failed to fetch details for this audit flag.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlag || !modalData) return;
    setModalLoading(true);
    setModalError('');

    try {
      let endpoint = '';
      if (selectedFlag.type === 'Bank Delta Mismatch') {
        endpoint = `http://localhost:3000/finance/daily-sales/${selectedFlag.id}`;
      } else {
        endpoint = `http://localhost:3000/waybills/${selectedFlag.id}`;
      }
      await axios.put(endpoint, modalData);
      setSelectedFlag(null);
      fetchDashboardMetrics();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to update record.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing Operational Ledgers...</p>
      </div>
    );
  }

  const isCEO = userRole.includes('CEO') || userRole.includes('Super Admin');
  const isClerkOrFinance = userRole.includes('Clerk') || userRole.includes('Finance');

  // Math recalculations for live modal updates (Daily Sales)
  let localBalanced = true;
  let localRemittance = 0;
  let localExpected = 0;
  let localDelta = 0;

  if (selectedFlag?.type === 'Bank Delta Mismatch' && modalData) {
    const cashPos = Number(modalData.cash_pos || 0);
    const credit = Number(modalData.credit || 0);
    const gross = Number(modalData.gross_sales || 0);
    const exp = Number(modalData.expenses || 0);
    const credPaid = Number(modalData.credit_paid || 0);
    const actBanked = Number(modalData.actual_banked || 0);

    localBalanced = cashPos + credit === gross;
    localRemittance = gross * 0.05;
    localExpected = gross - localRemittance - exp + credPaid;
    localDelta = actBanked - localExpected;
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
                <div 
                  key={index} 
                  onClick={() => handleFlagClick(flag)}
                  className="flex items-start justify-between py-3.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-slate-50 transition-all rounded px-2 -mx-2"
                >
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      flag.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {flag.type}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{flag.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase font-mono">{flag.severity}</span>
                    <span className="text-[10px] font-semibold text-blue-600 hover:underline">
                      {isCEO ? 'View Details' : 'View & Update'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Flag View/Edit Modal Overlay */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-blue-900">
                {selectedFlag.type} (ID: {selectedFlag.id})
              </h3>
              <button onClick={() => setSelectedFlag(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalLoading && !modalData && (
              <p className="text-sm text-slate-500 animate-pulse text-center py-6">Syncing audit logs context...</p>
            )}

            {modalError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-semibold">
                {modalError}
              </div>
            )}

            {modalData && (
              <form onSubmit={handleUpdateRecord} className="space-y-4">
                {isCEO && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded">
                    You have <strong>Read-Only</strong> permissions as CEO. Use the Close button to dismiss.
                  </p>
                )}

                {/* Conditional Fields based on Flag Type */}
                {selectedFlag.type === 'Bank Delta Mismatch' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Posting Date</label>
                      <input 
                        type="date" 
                        disabled 
                        value={modalData.posting_date || ''} 
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash / POS (₦)</label>
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.cash_pos || 0} 
                          onChange={(e) => setModalData({ ...modalData, cash_pos: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Sales (₦)</label>
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.credit || 0} 
                          onChange={(e) => setModalData({ ...modalData, credit: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Declared Gross Sales (₦)</label>
                      <div className="relative mt-1">
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.gross_sales || 0} 
                          onChange={(e) => setModalData({ ...modalData, gross_sales: Number(e.target.value) })}
                          className={`w-full rounded-lg border p-2 text-sm disabled:bg-slate-50 disabled:cursor-not-allowed ${
                            localBalanced ? 'border-slate-200 text-blue-900' : 'border-red-300 bg-red-50 text-red-900'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Scale className={`h-4 w-4 ${localBalanced ? 'text-emerald-500' : 'text-red-500'}`} />
                          <span className={`text-[10px] font-bold ${localBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                            {localBalanced ? 'Balanced' : 'Mismatch'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Depot Expenses (₦)</label>
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.expenses || 0} 
                          onChange={(e) => setModalData({ ...modalData, expenses: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Paid (₦)</label>
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.credit_paid || 0} 
                          onChange={(e) => setModalData({ ...modalData, credit_paid: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Actual Banked (₦)</label>
                      <input 
                        type="number" 
                        disabled={isCEO}
                        value={modalData.actual_banked || 0} 
                        onChange={(e) => setModalData({ ...modalData, actual_banked: Number(e.target.value) })}
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm font-bold text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 border">
                      <div className="flex justify-between text-slate-500">
                        <span>Management Remittance (5%):</span>
                        <span className="font-bold">-₦{localRemittance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-bold">
                        <span>Expected Bank:</span>
                        <span>₦{localExpected.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between font-bold border-t pt-1.5 ${
                        localDelta === 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        <span>Bank Delta Variance:</span>
                        <span>₦{localDelta.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Waybill Number</label>
                      <input 
                        type="text" 
                        disabled 
                        value={modalData.waybill_no || ''} 
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sender Name</label>
                        <input 
                          type="text" 
                          disabled={isCEO}
                          value={modalData.sender_name || ''} 
                          onChange={(e) => setModalData({ ...modalData, sender_name: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receiver Name</label>
                        <input 
                          type="text" 
                          disabled={isCEO}
                          value={modalData.receiver_name || ''} 
                          onChange={(e) => setModalData({ ...modalData, receiver_name: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item Contents</label>
                      <input 
                        type="text" 
                        disabled={isCEO}
                        value={modalData.item_description || ''} 
                        onChange={(e) => setModalData({ ...modalData, item_description: e.target.value })}
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Calculated price (₦)</label>
                        <input 
                          type="number" 
                          disabled 
                          value={modalData.official_calculated_price || 0} 
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Charged price (₦)</label>
                        <input 
                          type="number" 
                          disabled={isCEO}
                          value={modalData.final_charged_price || 0} 
                          onChange={(e) => setModalData({ ...modalData, final_charged_price: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm font-bold text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer pt-2">
                        <input 
                          type="checkbox" 
                          disabled={isCEO}
                          checked={modalData.is_discount_approved} 
                          onChange={(e) => setModalData({ ...modalData, is_discount_approved: e.target.checked })}
                          className="h-4 w-4 text-blue-900 focus:ring-blue-600 disabled:cursor-not-allowed"
                        />
                        <span>Discount Approved by Management</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setSelectedFlag(null)} 
                    className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-bold"
                  >
                    {isCEO ? 'Close' : 'Cancel'}
                  </button>
                  {!isCEO && (
                    <button 
                      type="submit" 
                      disabled={modalLoading || !localBalanced}
                      className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-950 text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {modalLoading ? 'Saving...' : 'Save Corrections'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
