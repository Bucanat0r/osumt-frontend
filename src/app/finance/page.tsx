'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, FileText, Lock, AlertCircle, CheckCircle, Scale } from 'lucide-react';

export default function DailySalesPosting() {
  // Financial Input Form Fields
  const [cashPos, setCashPos] = useState<number>(0);
  const [credit, setCredit] = useState<number>(0);
  const [grossSales, setGrossSales] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [creditPaid, setCreditPaid] = useState<number>(0);
  const [actualBanked, setActualBanked] = useState<number>(0);
  const [postingDate, setPostingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);

  // Real-Time System Evaluation Outputs
  const [remittanceDeduction, setRemittanceDeduction] = useState<number>(0);
  const [expectedBank, setExpectedBank] = useState<number>(0);
  const [bankDelta, setBankDelta] = useState<number>(0);
  
  // Status Handling
  const [isBalanced, setIsBalanced] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [successRecord, setSuccessRecord] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');

  // Automatically track balancing and calculate math rules before submitting
  useEffect(() => {
    // Rule 1: Validate gross ledger balancing parameters
    const formulaGross = cashPos + credit;
    setIsBalanced(formulaGross === grossSales);

    // Rule 2: Automate 5% management remittance on total gross sales
    const fivePercent = grossSales * 0.05;
    setRemittanceDeduction(fivePercent);

    // Rule 3: Process Expected Bank formula
    // Expected Bank = Gross - 5% Remittance - Expenses + Credit Paid
    const expected = grossSales - fivePercent - expenses + creditPaid;
    setExpectedBank(expected);

    // Rule 4: Compute Bank Delta variance
    setBankDelta(actualBanked - expected);
  }, [cashPos, credit, grossSales, expenses, creditPaid, actualBanked]);

  const handleSubmitFinanceSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessRecord(null);

    // Block submission immediately if totals don't match the strict balance condition
    if (!isBalanced) {
      setApiError('Cannot close day. Cash/POS + Credit must equal Gross Sales.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        depot_id: 1, // Fallback placeholder for prototype routing context
        posting_date: postingDate,
        cash_pos: Number(cashPos),
        credit: Number(credit),
        gross_sales: Number(grossSales),
        expenses: Number(expenses),
        credit_paid: Number(creditPaid),
        actual_banked: Number(actualBanked),
        bank_proof_url: bankProofFile
          ? `https://storage.osumtgo.com/proofs/${bankProofFile.name}`
          : 'https://storage.osumtgo.com/proofs/mock-slip.jpg'
      };

      const response = await axios.post('http://localhost:3000/finance/daily-sales', payload);
      setSuccessRecord(response.data);
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Server error uploading financial records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Module Title Section */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">End-of-Day Revenue Posting</h1>
            <p className="text-sm text-slate-500">Digitize physical workbook records and run automated financial validations.</p>
          </div>
          <FileText className="h-8 w-8 text-blue-900" />
        </div>

        {/* Global Alert Notification Triggers */}
        {apiError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3.5 text-sm font-semibold text-red-600 border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {successRecord && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-100">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-base">Day Closed & Locked Successfully!</p>
              <p className="mt-1 font-mono text-xs text-emerald-700">Record ID: {successRecord.id} | Generated Bank Delta: ₦{Number(successRecord.bank_delta).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Main Processing Form Layout */}
        <form onSubmit={handleSubmitFinanceSheet} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Form Columns 1 & 2: Primary Bookkeeping Input Fields */}
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Gross Sales Parameters</h2>
                <input 
                  type="date" 
                  value={postingDate} 
                  onChange={(e) => setPostingDate(e.target.value)} 
                  className="rounded border border-slate-200 p-1 text-xs font-semibold text-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cash / POS Revenue (₦)</label>
                  <input type="number" required value={cashPos || ''} onChange={(e) => setCashPos(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600 font-medium" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Sub-ledger Credit Sales (₦)</label>
                  <input type="number" required value={credit || ''} onChange={(e) => setCredit(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600 font-medium" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Declared Total Gross Sales (₦)</label>
                <div className="relative mt-1">
                  <input 
                    type="number" 
                    required 
                    value={grossSales || ''} 
                    onChange={(e) => setGrossSales(Number(e.target.value))} 
                    className={`w-full rounded-lg border p-2.5 text-base font-bold focus:outline-none ${
                      isBalanced ? 'border-slate-200 focus:border-blue-600 text-blue-900' : 'border-red-300 bg-red-50 text-red-900 focus:border-red-500'
                    }`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Scale className={`h-4 w-4 ${isBalanced ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isBalanced ? 'Balanced' : 'Mismatch'}
                    </span>
                  </div>
                </div>
                {!isBalanced && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    * Balance Mismatch: Cash + Credit adds up to <span className="underline">₦{(cashPos + credit).toLocaleString()}</span> instead of ₦{grossSales.toLocaleString()}.
                  </p>
                )}
              </div>
            </div>

            {/* Deductions & Receipts Adjustments Sub-module */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">Deductions & Credit Follow-up</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Approved Depot Expenses (₦)</label>
                  <input type="number" value={expenses || ''} onChange={(e) => setExpenses(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Outstanding Credit Paid (₦)</label>
                  <input type="number" value={creditPaid || ''} onChange={(e) => setCreditPaid(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:border-blue-600" />
                </div>
              </div>
            </div>

            {/* Bank Deposit Verification Sub-module */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2">Physical Tellers / Banking Input</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Actual Amount Paid to Bank (₦)</label>
                  <input type="number" required value={actualBanked || ''} onChange={(e) => setActualBanked(Number(e.target.value))} className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Attach Bank Teller Proof Document</label>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setBankProofFile(e.target.files[0]);
                      }
                    }} 
                    className="w-full mt-1 text-xs block file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Automated Calculations Summary Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-md border border-slate-100 space-y-6 sticky top-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b pb-2 flex items-center gap-1">
                System Verification Engine
              </h2>

              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Automatic 5% Remittance:</span>
                  <span className="font-mono font-bold text-slate-700">-₦{remittanceDeduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700 font-bold bg-slate-50 p-2 rounded">
                  <span>Expected Bank Deposit:</span>
                  <span className="font-mono text-blue-900">₦{expectedBank.toLocaleString()}</span>
                </div>
              </div>

              {/* Dynamic Bank Delta Display Panel */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Calculated Bank Delta Variance</label>
                <div className={`p-3 rounded-lg text-center font-mono text-xl font-black border ${
                  bankDelta === 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : bankDelta > 0 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {bankDelta > 0 ? '+' : ''}{bankDelta.toLocaleString()} ₦
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center font-medium">
                  {bankDelta === 0 
                    ? 'Perfect match. Accounts balanced.' 
                    : bankDelta > 0 
                    ? 'Surplus cash variance identified.' 
                    : 'Shortage flag triggered. Audit record created.'}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={loading || !isBalanced}
                className="w-full rounded-lg bg-blue-900 py-3 font-bold text-white transition-colors hover:bg-blue-950 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Lock className="h-4 w-4" /> Close & Lock Day
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
