'use client';

import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Search, Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ArrowLeft, Copy } from 'lucide-react';

export default function TrackingPage() {
  const [waybillNo, setWaybillNo] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybillNo.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.get(`http://localhost:3000/waybills/track/${waybillNo.trim()}`);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Waybill not found. Please check the tracking number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.waybill_no) {
      navigator.clipboard.writeText(result.waybill_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Status timeline logic
  const statusSteps = ['Registered', 'Processing', 'In Transit', 'Arrived', 'Delivered'];
  const currentStepIndex = result ? statusSteps.indexOf(result.status) : -1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-emerald-600';
      case 'In Transit': return 'text-blue-600';
      case 'Arrived': return 'text-indigo-600';
      case 'Processing': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-50 border-emerald-200';
      case 'In Transit': return 'bg-blue-50 border-blue-200';
      case 'Arrived': return 'bg-indigo-50 border-indigo-200';
      case 'Processing': return 'bg-amber-50 border-amber-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-sans pb-12 antialiased">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white rounded-md p-1.5 flex items-center justify-center font-bold text-xs h-8 w-8 select-none">
            &gt;-
          </div>
          <span className="font-semibold text-[19px] tracking-tight text-slate-800">
            tabler
          </span>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded ml-2 uppercase tracking-wide">
            osumt go
          </span>
        </div>
        <Link 
          href="/dashboard" 
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 border shadow-sm hover:bg-slate-50 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-10">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Track Your Shipment</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your waybill tracking number to get real-time updates on your package.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleTrack} className="relative mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={waybillNo}
                onChange={(e) => setWaybillNo(e.target.value)}
                placeholder="e.g. OSUMT-1234-567890"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !waybillNo.trim()}
              className="px-6 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                'Track'
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in">
            
            {/* Status Hero Card */}
            <div className={`rounded-xl border p-6 ${getStatusBg(result.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Waybill Number</span>
                    <button onClick={handleCopy} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" title="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {copied && <span className="text-[10px] font-bold text-emerald-600">Copied!</span>}
                  </div>
                  <p className="text-xl font-bold font-mono text-slate-800 tracking-wide">{result.waybill_no}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Status</span>
                  <p className={`text-lg font-bold ${getStatusColor(result.status)}`}>{result.status}</p>
                </div>
              </div>
            </div>

            {/* Route Info */}
            {(result.origin || result.destination) && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Shipping Route</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Origin</p>
                      <p className="text-sm font-semibold text-slate-800">{result.origin || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex-1 mx-4 border-t-2 border-dashed border-slate-200 relative">
                    <Truck className="h-5 w-5 text-blue-600 absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Destination</p>
                      <p className="text-sm font-semibold text-slate-800 text-right">{result.destination || 'N/A'}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Timeline */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Shipment Progress</h3>
              <div className="flex items-center justify-between relative">
                {/* Background connector line */}
                <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-slate-200"></div>
                <div 
                  className="absolute top-4 left-[10%] h-0.5 bg-blue-600 transition-all duration-700" 
                  style={{ width: `${Math.max(0, currentStepIndex) * 20}%` }}
                ></div>
                
                {statusSteps.map((step, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center relative z-10" style={{ width: '20%' }}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-slate-300 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-[10px] font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold mt-2 text-center leading-tight ${
                        isCompleted ? 'text-blue-600' : 'text-slate-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sender & Receiver Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Sender & Receiver
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sender</p>
                      <p className="text-sm font-semibold text-slate-800">{result.sender_name}</p>
                      <p className="text-xs text-slate-500">{result.sender_phone}</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-200 ml-4 h-3"></div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receiver</p>
                      <p className="text-sm font-semibold text-slate-800">{result.receiver_name}</p>
                      <p className="text-xs text-slate-500">{result.receiver_phone}</p>
                      {result.receiver_address && (
                        <p className="text-xs text-slate-400 mt-0.5">{result.receiver_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package & Payment Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Package Details
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contents</span>
                    <span className="font-semibold text-slate-800">{result.item_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Declared Value</span>
                    <span className="font-semibold text-slate-800">₦{Number(result.declared_value).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weight</span>
                    <span className="font-semibold text-slate-800">{result.chargeable_weight} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fragile Handling</span>
                    <span className={`font-semibold ${result.is_fragile ? 'text-amber-600' : 'text-slate-400'}`}>
                      {result.is_fragile ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Home Delivery</span>
                    <span className={`font-semibold ${result.is_home_delivery ? 'text-blue-600' : 'text-slate-400'}`}>
                      {result.is_home_delivery ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between">
                    <span className="text-slate-500">Amount Charged</span>
                    <span className="font-bold text-blue-900 text-sm">₦{Number(result.final_charged_price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                      result.payment === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {result.payment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Date */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Registered</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {result.created_at ? new Date(result.created_at).toLocaleDateString('en-GB', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
              <Truck className="h-6 w-6 text-blue-600" />
            </div>

          </div>
        )}

        {/* Empty State (before search) */}
        {!result && !error && !loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-slate-100 mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Enter a waybill tracking number above to get started.</p>
            <p className="text-xs text-slate-400 mt-1">Your tracking number looks like: <span className="font-mono font-bold">OSUMT-XXXX-XXXXXX</span></p>
          </div>
        )}

      </main>
    </div>
  );
}
