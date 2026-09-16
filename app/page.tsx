'use client';

import React, { useState, useEffect } from 'react';
import StatCard from './components/StatCard';
import StatusBadge from './components/StatusBadge';
import ReturnModal from './components/ReturnModal';
import { useUser } from './context/UserContext';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  ClipboardList,
  RotateCcw,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useUser();
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [overdueBookings, setOverdueBookings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [selectedReturnBooking, setSelectedReturnBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, pendingRes, overdueRes, recentRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/bookings?status=PENDING'),
        fetch('/api/bookings?status=ISSUED'),
        fetch('/api/bookings?role=ADMIN'),
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (pendingRes.ok) setPendingBookings(await pendingRes.json());
      
      if (overdueRes.ok) {
        const issued = await overdueRes.json();
        const now = new Date();
        const overdue = issued.filter((b: any) => new Date(b.endDate) < now);
        setOverdueBookings(overdue);
      }

      if (recentRes.ok) {
        const recent = await recentRes.json();
        setRecentBookings(recent.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-sky-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> St. Jude AV Lending Desk System
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name || 'Borrower'}!
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Role: <span className="font-semibold text-white uppercase">{currentUser?.role}</span> ({currentUser?.department || 'AV Department'}). Track physical unit schedule, process instant returns with deposit calculation, and enforce booking limits.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none">
          <Camera className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gear Types"
          value={metrics?.totalGearItems || 0}
          subtitle={`${metrics?.totalUnits || 0} physical units tracked`}
          icon={Camera}
          color="sky"
        />
        <StatCard
          title="Available Units"
          value={metrics?.availableUnits || 0}
          subtitle="Ready for immediate checkout"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Currently Borrowed"
          value={metrics?.currentlyBorrowed || 0}
          subtitle={`${metrics?.upcomingBookings || 0} approved upcoming`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Overdue Gear"
          value={metrics?.overdueBookingsCount || 0}
          subtitle={`${metrics?.damagedOrMissingUnits || 0} damaged/missing`}
          icon={AlertTriangle}
          color={metrics?.overdueBookingsCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Requests</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.pendingRequests || 0}</h4>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs">
            Needs Staff Action
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Late Fees Collected</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">${metrics?.outstandingLateFees?.toFixed(2) || '0.00'}</h4>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs">
            Deducted from Deposits
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Maintenance / Damaged</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">{metrics?.damagedOrMissingUnits || 0}</h4>
          </div>
          <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
            Units Unavailable
          </span>
        </div>
      </div>

      {/* Action Center & Overdue Urgent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Urgent Overdue & Pending Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Bookings Notice */}
          {overdueBookings.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-rose-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                  ⚠️ Overdue Rentals Requiring Return ({overdueBookings.length})
                </h3>
                <Link
                  href="/admin/returns"
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1"
                >
                  Process Returns <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-rose-200/60">
                {overdueBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{b.gearItem?.name} ({b.gearUnit?.unitTag})</p>
                      <p className="text-slate-600">Borrower: {b.user?.name} | Due: {new Date(b.endDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedReturnBooking(b)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shadow-sm"
                    >
                      Process Return
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Approval Requests */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" /> Pending Booking Requests ({pendingBookings.length})
              </h3>
              <Link href="/admin/requests" className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending request queue. All clear!</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {b.bookingCode}
                        </span>
                        <span className="font-bold text-slate-900">{b.gearItem?.name}</span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Requested by <span className="font-semibold text-slate-700">{b.user?.name}</span> for {b.purpose}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={b.status} />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Workflow Summary Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Quick Operational Actions</h3>

            <div className="space-y-2.5">
              <Link
                href="/gear"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-sky-700">Browse Gear Inventory</h4>
                    <p className="text-[11px] text-slate-500">Check physical unit tags & reserve equipment</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>

              <Link
                href="/availability"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">Availability Matrix</h4>
                    <p className="text-[11px] text-slate-500">7-day timeline view per physical unit</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/admin/returns"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Process Unit Returns</h4>
                    <p className="text-[11px] text-slate-500">Condition inspect & late fee calculation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {selectedReturnBooking && (
        <ReturnModal
          booking={selectedReturnBooking}
          onClose={() => setSelectedReturnBooking(null)}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}
