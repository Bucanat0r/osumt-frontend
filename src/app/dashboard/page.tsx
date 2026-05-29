'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteCookie, getCookie } from 'cookies-next';
import { 
  TrendingUp, 
  AlertTriangle, 
  Landmark, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  X, 
  CheckCircle, 
  Scale, 
  Truck, 
  User as UserIcon, 
  BookOpen, 
  Clock,
  Bell,
  Code,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Search
} from 'lucide-react';
import DailySalesPosting from '../finance/page';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  // Clerk specific tabs: 'control-tower' | 'finance-desk' | 'payment-desk'
  const [activeTab, setActiveTab] = useState<'control-tower' | 'finance-desk' | 'payment-desk'>('control-tower');

  // Payment Desk State
  const [todaysWaybills, setTodaysWaybills] = useState<any[]>([]);
  const [paymentUpdating, setPaymentUpdating] = useState<number | null>(null);

  // Flag Modal State
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchDashboardMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:3000/admin/dashboard');
      setData(response.data);
    } catch (err) {
      console.error('Error parsing dashboard metrics', err);
    }
  };

  const fetchRecentWaybills = async () => {
    try {
      const response = await axios.get('http://localhost:3000/waybills');
      setRecentWaybills(response.data.slice(0, 4));
    } catch (err) {
      console.error('Error fetching waybills', err);
    }
  };

  const fetchTodaysWaybills = async () => {
    try {
      const response = await axios.get('http://localhost:3000/waybills/today');
      setTodaysWaybills(response.data);
    } catch (err) {
      console.error('Error fetching today\'s waybills', err);
    }
  };

  const handleMarkPaid = async (waybillId: number) => {
    setPaymentUpdating(waybillId);
    try {
      await axios.patch(`http://localhost:3000/waybills/${waybillId}/payment`);
      // Refresh the list immediately after update
      await fetchTodaysWaybills();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setPaymentUpdating(null);
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

    const init = async () => {
      setLoading(true);
      if (isCEO || isClerkOrFinance) {
        await fetchDashboardMetrics();
      }
      if (isClerkOrFinance) {
        await fetchTodaysWaybills();
      }
      await fetchRecentWaybills();
      setLoading(false);
    };

    init();
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
      await fetchDashboardMetrics();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to update record.');
    } finally {
      setModalLoading(false);
    }
  };

  const isCEO = userRole.includes('CEO') || userRole.includes('Super Admin');
  const isClerk = userRole.includes('Clerk') || userRole.includes('Finance');

  // Audit Flags filtering
  const flags = data?.flags || [];
  const activeFlags = flags.filter((f: any) => !f.resolved);
  const resolvedFlags = flags.filter((f: any) => f.resolved);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] font-sans">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Syncing Operational Ledgers...</p>
      </div>
    );
  }

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

  const modalIsReadOnly = isCEO || selectedFlag?.resolved;

  // Render mock data helper if empty
  const defaultRecentWaybills = recentWaybills.length > 0 ? recentWaybills : [
    { waybill_no: 'WB-0529-001', sender_name: 'Ronald Bradley', chargeable_weight: 12, item_description: 'Initial commit' },
    { waybill_no: 'WB-0529-002', sender_name: 'Russell Gibson', chargeable_weight: 8, item_description: 'Main structure' },
    { waybill_no: 'WB-0529-003', sender_name: 'Beverly Armstrong', chargeable_weight: 15, item_description: 'Left sidebar adjustments' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-sans pb-12 antialiased">
      
      {/* Tabler-Style Main Header */}
      <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
        {/* Brand Logo Container */}
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

        {/* Action Elements Bar */}
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com/tabler/tabler" 
            target="_blank" 
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50/50 rounded-lg text-xs font-bold transition-all"
          >
            Source code
          </a>
          
          <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-50 relative cursor-pointer">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" 
              alt="Profile" 
              className="h-8 w-8 rounded-full border border-slate-200 shadow-xs object-cover"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-700 leading-tight">Jane Pearson</p>
              <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wider">{userRole || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Subheader Tab Navigation Bar */}
      <nav className="bg-white border-b border-slate-200/80 px-6 h-12 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <div className="flex items-center h-full gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
          {/* Dashboard Tab */}
          <button 
            onClick={() => {
              if (isClerk) setActiveTab('control-tower');
              else router.push('/dashboard');
            }}
            className={`h-full px-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              (userRole === 'User' || activeTab === 'control-tower') 
                ? 'text-blue-600 border-blue-600 bg-blue-50/10 font-semibold' 
                : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Clock className="h-4 w-4" /> Home
          </button>

          {/* Waybills Desk */}
          {!isCEO && (
            <button 
              onClick={() => router.push('/waybills')}
              className="h-full px-3 text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer"
            >
              <Truck className="h-4 w-4" /> Waybills Desk
            </button>
          )}

          {/* Track Shipment (User and Clerk) */}
          {!isCEO && (
            <button 
              onClick={() => router.push('/tracking')}
              className="h-full px-3 text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer"
            >
              <Search className="h-4 w-4" /> Track Shipment
            </button>
          )}

          {/* Finance Desk Tab (For Clerk only) */}
          {isClerk && (
            <button 
              onClick={() => setActiveTab('finance-desk')}
              className={`h-full px-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'finance-desk' 
                  ? 'text-blue-600 border-blue-600 bg-blue-50/10 font-semibold' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Landmark className="h-4 w-4" /> Finance Desk
            </button>
          )}

          {/* Payment Desk Tab (For Clerk only) */}
          {isClerk && (
            <button 
              onClick={() => { setActiveTab('payment-desk'); fetchTodaysWaybills(); }}
              className={`h-full px-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'payment-desk' 
                  ? 'text-blue-600 border-blue-600 bg-blue-50/10 font-semibold' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Scale className="h-4 w-4" /> Payment Desk
            </button>
          )}

        </div>

        <button 
          onClick={handleLogout} 
          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/50 border border-red-150 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Log Out
        </button>
      </nav>

      {/* Main Page Layout Container */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        
        {/* Title Heading */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-[22px] font-semibold text-slate-800 leading-tight">Dashboard</h2>
          </div>
        </div>

        {/* -------------------- ROLE: USER -------------------- */}
        {userRole === 'User' && (
          <div className="space-y-6">
            
            {/* 6-Grid metrics cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Registered</span>
                  <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+6% ▲</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">{recentWaybills.length || 3}</p>
                  <p className="text-[10px] text-slate-400 mt-1">New Waybills Today</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">In Transit</span>
                  <span className="text-rose-500 bg-rose-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">-3% ▼</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">17</p>
                  <p className="text-[10px] text-slate-400 mt-1">Dispatched Packages</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Delivered</span>
                  <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+9% ▲</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">7</p>
                  <p className="text-[10px] text-slate-400 mt-1">Successful Deliveries</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cargo Weight</span>
                  <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+3% ▲</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">27.3k</p>
                  <p className="text-[10px] text-slate-400 mt-1">Total Weight (KG)</p>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Daily Sales</span>
                  <span className="text-rose-500 bg-rose-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">-2% ▼</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">$95</p>
                  <p className="text-[10px] text-slate-400 mt-1">Waybill Revenue</p>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-start text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                  <span className="text-rose-500 bg-rose-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">-1% ▼</span>
                </div>
                <div>
                  <p className="text-[26px] font-bold text-slate-800 leading-none">621</p>
                  <p className="text-[10px] text-slate-400 mt-1">Uncollected Freight</p>
                </div>
              </div>

            </div>

            {/* Split layout: Floatable Waybill mockup card (Left) & Recent activity list (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Floatable Waybill Form Mockup Card (Spans 2/3) */}
              <div 
                onClick={() => router.push('/waybills')}
                className="group lg:col-span-2 bg-white border border-slate-200/85 rounded-xl shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col"
              >
                {/* Overlay hover launch banner */}
                <div className="absolute inset-0 bg-blue-900/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-lg flex items-center gap-2 transform scale-95 group-hover:scale-100 transition-all duration-300">
                    Launch Waybill Registration Desk
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>

                {/* Card Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/60 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Waybill Registration Desk</h3>
                    <p className="text-xs text-slate-400">Click anywhere to open the live shipping quote form</p>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>

                {/* Simulated Waybill Form Mockup */}
                <div className="p-6 space-y-4 select-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sender Name</label>
                      <div className="mt-1 h-9 bg-slate-50 rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                        John Doe
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receiver Name</label>
                      <div className="mt-1 h-9 bg-slate-50 rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                        Jane Smith
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Contents</label>
                    <div className="mt-1 h-9 bg-slate-50 rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                      Electronics, Spare Parts
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (KG)</label>
                      <div className="mt-1 h-9 bg-slate-50 rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                        5
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fragile Handling</label>
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-4 w-4 rounded border border-slate-350 bg-slate-50 block"></span> Yes (+₦1,500)
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Option</label>
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-4 w-4 rounded border border-slate-350 bg-slate-50 block"></span> Door-to-Door
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs">
                      Save & Issue Waybill
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity List Card (Spans 1/3, matching Tabler Development Activity structure) */}
              <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col">
                <div className="px-5 py-4 border-b border-slate-250/60">
                  <h3 className="text-sm font-semibold text-slate-800">Development Activity</h3>
                </div>
                
                {/* SVG purchases chart line at top */}
                <div className="bg-slate-50/20 py-2 border-b border-slate-100 relative">
                  <span className="text-[10px] font-semibold text-slate-400 absolute left-4 top-2 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span> Purchases
                  </span>
                  <svg className="w-full h-16 pt-6" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#206bc4" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#206bc4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M0 60 Q 40 40, 80 50 T 160 55 T 240 45 T 320 60 T 400 35 T 480 15 T 500 10 L 500 100 L 0 100 Z" 
                      fill="url(#chartGradient)" 
                    />
                    <path 
                      d="M0 60 Q 40 40, 80 50 T 160 55 T 240 45 T 320 60 T 400 35 T 480 15 T 500 10" 
                      fill="none" 
                      stroke="#206bc4" 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>

                {/* Commits table */}
                <div className="divide-y divide-slate-100 flex-1">
                  {defaultRecentWaybills.map((wb, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/40">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 select-none">
                          {wb.sender_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 leading-tight">{wb.sender_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{wb.waybill_no}</p>
                          <p className="text-[10px] text-slate-400">{wb.item_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-slate-400">May 29, 2026</span>
                        <button className="text-slate-350 hover:text-red-500 rounded p-1 hover:bg-slate-100">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- ROLE: CLERK / CEO -------------------- */}
        {(isClerk || isCEO) && (
          <div className="space-y-6">
            
            {/* Control Tower Tab switching Header (Only for Clerk) */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {isCEO ? 'Executive Control Tower' : 'Administrative Desk'}
                </h3>
              </div>
              {isClerk && (
                <div className="flex border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-xs">
                  <button 
                    onClick={() => setActiveTab('control-tower')}
                    className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'control-tower' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Control Tower
                  </button>
                  <button 
                    onClick={() => setActiveTab('finance-desk')}
                    className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'finance-desk' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Finance Desk
                  </button>
                  <button 
                    onClick={() => { setActiveTab('payment-desk'); fetchTodaysWaybills(); }}
                    className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'payment-desk' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Payment Desk
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'control-tower' ? (
              <div className="space-y-6">
                
                {/* 6-Grid metrics cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  
                  {/* Card 1: Gross Sales */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales</span>
                      <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+6% ▲</span>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-slate-800 leading-none">₦{data?.cards?.grossSales?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Total revenue collected</p>
                    </div>
                  </div>

                  {/* Card 2: Expenses */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Expenses</span>
                      <span className="text-rose-500 bg-rose-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">-3% ▼</span>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-slate-800 leading-none">₦{data?.cards?.expenses?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Approved depot cashout</p>
                    </div>
                  </div>

                  {/* Card 3: Expected Bank */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Expected Bank</span>
                      <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+9% ▲</span>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-blue-700 leading-none">₦{data?.cards?.expectedBank?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Expected deposit slip sum</p>
                    </div>
                  </div>

                  {/* Card 4: Net Variance */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Net Variance</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        (data?.cards?.netDelta || 0) >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'
                      }`}>
                        {(data?.cards?.netDelta || 0) >= 0 ? 'Green' : 'Critical'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-[22px] font-bold leading-none ${
                        (data?.cards?.netDelta || 0) >= 0 ? 'text-emerald-600' : 'text-red-650'
                      }`}>
                        ₦{data?.cards?.netDelta?.toLocaleString() || '0'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Net banking discrepancy</p>
                    </div>
                  </div>

                  {/* Card 5: Active Flags */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Active Flags</span>
                      <span className="text-rose-500 bg-rose-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">-2% ▼</span>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-slate-800 leading-none">{activeFlags.length}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Requires reconciliation</p>
                    </div>
                  </div>

                  {/* Card 6: Resolved Flags */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between h-[100px]">
                    <div className="flex justify-between items-start text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Resolved</span>
                      <span className="text-emerald-500 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+3% ▲</span>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-slate-800 leading-none">{resolvedFlags.length}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Resolved audit history</p>
                    </div>
                  </div>

                </div>

                {/* Main Content Split: Tables (Left) & Documentation/Charts (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Tables Column (Left, Spans 2/3) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Active Flags */}
                    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
                      <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Automated Audit Flags & Anomalies ({activeFlags.length})
                        </h3>
                      </div>
                      
                      {activeFlags.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-10 font-medium">All systems green. No financial leakage anomalies detected across active channels.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {activeFlags.map((flag: any, index: number) => (
                            <div 
                              key={index} 
                              onClick={() => handleFlagClick(flag)}
                              className="flex items-start justify-between p-4 cursor-pointer hover:bg-slate-50 transition-all"
                            >
                              <div className="space-y-1 pr-4">
                                <span className={`inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                                  flag.severity === 'Critical' ? 'bg-red-50 text-red-650 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {flag.type}
                                </span>
                                <p className="text-xs font-semibold text-slate-700">{flag.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase">{flag.severity}</span>
                                <span className="text-[10px] font-bold text-blue-600 hover:underline">
                                  {isCEO ? 'View Details' : 'View & Update'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resolved Flags */}
                    {resolvedFlags.length > 0 && (
                      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden flex flex-col border-l-4 border-l-emerald-500">
                        <div className="px-5 py-4 border-b border-slate-200/60 bg-emerald-50/10 flex justify-between items-center">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            Resolved Audit Flags & Corrections ({resolvedFlags.length})
                          </h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {resolvedFlags.map((flag: any, index: number) => (
                            <div 
                              key={index} 
                              onClick={() => handleFlagClick(flag)}
                              className="flex items-start justify-between p-4 cursor-pointer hover:bg-slate-50 transition-all"
                            >
                              <div className="space-y-1 pr-4">
                                <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Resolved: {flag.type}
                                </span>
                                <p className="text-xs font-semibold text-slate-500 line-through">{flag.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[10px] font-bold text-emerald-600 hover:underline">
                                  View Adjustment
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documentation & SVG Charts Sidebar (Right, Spans 1/3) */}
                  <div className="space-y-6">
                    
                    {/* Blue Documentation Banner */}
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 flex flex-col justify-between hover:bg-blue-50 transition-all">
                      <p className="font-semibold leading-relaxed">
                        Read our documentation with code samples.
                      </p>
                      <a 
                        href="#" 
                        onClick={(e) => e.preventDefault()}
                        className="text-blue-600 font-bold mt-2 hover:underline inline-flex items-center gap-1"
                      >
                        Explore Docs ↗
                      </a>
                    </div>

                    {/* Chart 1: Donut Chart (Green) */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col items-center">
                      <div className="w-full text-left border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Anomaly Clearance Rate</h4>
                      </div>
                      
                      {/* SVG Donut Chart */}
                      <div className="relative flex items-center justify-center">
                        <svg className="w-36 h-36" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.2" />
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="15.915" 
                            fill="none" 
                            stroke="#2fb344" 
                            strokeWidth="3.2" 
                            strokeDasharray="63 37" 
                            strokeDashoffset="25" 
                          />
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="15.915" 
                            fill="none" 
                            stroke="#8cd494" 
                            strokeWidth="3.2" 
                            strokeDasharray="37 63" 
                            strokeDashoffset="88" 
                          />
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-[20px] font-bold text-slate-800 leading-none">63.0%</p>
                          <p className="text-[9px] text-slate-400 mt-1">Resolved</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mt-4 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#2fb344]"></span> Resolved (63.0%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#8cd494]"></span> Pending (37.0%)
                        </span>
                      </div>
                    </div>

                    {/* Chart 2: Pie Chart (Blue/Slate) */}
                    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col items-center">
                      <div className="w-full text-left border-b border-slate-100 pb-3 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue Channels Allocation</h4>
                      </div>

                      {/* SVG Pie Chart */}
                      <div className="relative flex items-center justify-center">
                        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="8" fill="none" stroke="#94a3b8" strokeWidth="16" strokeDasharray="100 100" />
                          <circle cx="16" cy="16" r="8" fill="none" stroke="#93c5fd" strokeWidth="16" strokeDasharray="91 100" />
                          <circle cx="16" cy="16" r="8" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="80.5 100" />
                          <circle cx="16" cy="16" r="8" fill="none" stroke="#1d4ed8" strokeWidth="16" strokeDasharray="47.4 100" />
                        </svg>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-5 text-[10px] font-semibold text-slate-500 w-full px-2">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#1d4ed8]"></span> Cash/POS (47.4%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#3b82f6]"></span> Credit Sales (33.1%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#93c5fd]"></span> Credit Paid (10.5%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#94a3b8]"></span> Expenses (9.0%)
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            ) : activeTab === 'finance-desk' ? (
              /* Inside clerk view, switch tab to Finance Desk daily sales form entry */
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                <DailySalesPosting />
              </div>
            ) : (
              /* Payment Desk: Today's Waybills with Payment Toggle */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Today's Waybills — Payment Status</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{todaysWaybills.length} waybill(s) processed today</p>
                  </div>
                  <button 
                    onClick={fetchTodaysWaybills}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>

                {todaysWaybills.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-xs">
                    <Truck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No waybills processed today yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Waybills registered today will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Waybill No</th>
                            <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Sender</th>
                            <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Receiver</th>
                            <th className="text-left px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Route</th>
                            <th className="text-right px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Amount (₦)</th>
                            <th className="text-center px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {todaysWaybills.map((wb: any) => (
                            <tr key={wb.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-blue-700">{wb.waybill_no}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-700">{wb.sender_name}</p>
                                <p className="text-[10px] text-slate-400">{wb.sender_phone}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-700">{wb.receiver_name}</p>
                                <p className="text-[10px] text-slate-400">{wb.receiver_phone}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-slate-600">{wb.origin || '—'}</p>
                                <p className="text-[10px] text-slate-400">→ {wb.destination || '—'}</p>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">
                                ₦{Number(wb.final_charged_price).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {wb.payment === 'Paid' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                    <CheckCircle className="h-3 w-3" /> Paid
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleMarkPaid(wb.id)}
                                    disabled={paymentUpdating === wb.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    {paymentUpdating === wb.id ? (
                                      <><RefreshCw className="h-3 w-3 animate-spin" /> Updating...</>
                                    ) : (
                                      <><Scale className="h-3 w-3" /> Unpaid — Click to Mark Paid</>
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          Paid: {todaysWaybills.filter((w: any) => w.payment === 'Paid').length}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                          Unpaid: {todaysWaybills.filter((w: any) => w.payment !== 'Paid').length}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Total: ₦{todaysWaybills.reduce((sum: number, w: any) => sum + Number(w.final_charged_price), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Flag View/Edit Modal Overlay */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-blue-900">
                {selectedFlag.type} (ID: {selectedFlag.id})
              </h3>
              <button onClick={() => setSelectedFlag(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                {selectedFlag.resolved ? (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-250 p-2.5 rounded flex items-center gap-1.5 font-bold">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    This operational flag has been resolved and logged in history.
                  </p>
                ) : isCEO ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded font-semibold">
                    You have Read-Only permissions as CEO. Use the Close button to dismiss.
                  </p>
                ) : null}

                {/* Conditional Fields based on Flag Type */}
                {selectedFlag.type === 'Bank Delta Mismatch' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Posting Date</label>
                      <input 
                        type="date" 
                        disabled 
                        value={modalData.posting_date || ''} 
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-medium animate-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash / POS (₦)</label>
                        <input 
                          type="number" 
                          disabled={modalIsReadOnly}
                          value={modalData.cash_pos || 0} 
                          onChange={(e) => setModalData({ ...modalData, cash_pos: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Sales (₦)</label>
                        <input 
                          type="number" 
                          disabled={modalIsReadOnly}
                          value={modalData.credit || 0} 
                          onChange={(e) => setModalData({ ...modalData, credit: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Declared Gross Sales (₦)</label>
                      <div className="relative mt-1">
                        <input 
                          type="number" 
                          disabled={modalIsReadOnly}
                          value={modalData.gross_sales || 0} 
                          onChange={(e) => setModalData({ ...modalData, gross_sales: Number(e.target.value) })}
                          className={`w-full rounded-lg border p-2 text-sm disabled:bg-slate-50 disabled:cursor-not-allowed font-bold ${
                            localBalanced ? 'border-slate-200 text-blue-900' : 'border-red-300 bg-red-50 text-red-900'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Scale className={`h-4 w-4 ${localBalanced ? 'text-emerald-500' : 'text-red-500'}`} />
                          <span className={`text-[10px] font-bold ${localBalanced ? 'text-emerald-600' : 'text-red-650'}`}>
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
                          disabled={modalIsReadOnly}
                          value={modalData.expenses || 0} 
                          onChange={(e) => setModalData({ ...modalData, expenses: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Paid (₦)</label>
                        <input 
                          type="number" 
                          disabled={modalIsReadOnly}
                          value={modalData.credit_paid || 0} 
                          onChange={(e) => setModalData({ ...modalData, credit_paid: Number(e.target.value) })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Actual Banked (₦)</label>
                      <input 
                        type="number" 
                        disabled={modalIsReadOnly}
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
                        localDelta === 0 ? 'text-emerald-600' : 'text-red-650'
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
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-mono font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sender Name</label>
                        <input 
                          type="text" 
                          disabled={modalIsReadOnly}
                          value={modalData.sender_name || ''} 
                          onChange={(e) => setModalData({ ...modalData, sender_name: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receiver Name</label>
                        <input 
                          type="text" 
                          disabled={modalIsReadOnly}
                          value={modalData.receiver_name || ''} 
                          onChange={(e) => setModalData({ ...modalData, receiver_name: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item Contents</label>
                      <input 
                        type="text" 
                        disabled={modalIsReadOnly}
                        value={modalData.item_description || ''} 
                        onChange={(e) => setModalData({ ...modalData, item_description: e.target.value })}
                        className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Calculated price (₦)</label>
                        <input 
                          type="number" 
                          disabled 
                          value={modalData.official_calculated_price || 0} 
                          className="w-full mt-1 rounded-lg border border-slate-200 p-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Charged price (₦)</label>
                        <input 
                          type="number" 
                          disabled={modalIsReadOnly}
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
                          disabled={modalIsReadOnly}
                          checked={modalData.is_discount_approved} 
                          onChange={(e) => setModalData({ ...modalData, is_discount_approved: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-600 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-bold cursor-pointer"
                  >
                    {modalIsReadOnly ? 'Close' : 'Cancel'}
                  </button>
                  {!modalIsReadOnly && (
                    <button 
                      type="submit" 
                      disabled={modalLoading || !localBalanced}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer animate-none"
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
