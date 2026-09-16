'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/app/components/StatusBadge';
import { useUser } from '@/app/context/UserContext';
import { ClipboardList, CheckCircle, HandMetal, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminRequestsPage() {
  const { currentUser } = useUser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings?role=ADMIN');
      if (res.ok) {
        const data = await res.json();
        // Filter pending and approved
        const activeQueue = data.filter((b: any) => b.status === 'PENDING' || b.status === 'APPROVED');
        setBookings(activeQueue);
      }
    } catch (err) {
      console.error('Failed to load requests queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (bookingId: string, action: 'APPROVE' | 'ISSUE' | 'REJECT') => {
    setError(null);
    try {
      const unitId = selectedUnits[bookingId];
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          staffUserId: currentUser?.id,
          gearUnitId: unitId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to perform ${action}`);
      }

      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-amber-500" /> Lending Staff Desk: Request Approvals & Issuance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review borrower requests, assign specific physical unit tags, and confirm physical gear checkout.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" /> Loading request queue...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Request Queue Empty</h3>
          <p className="text-xs">All pending borrowing requests have been approved or issued.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 text-xs">
                    {b.bookingCode}
                  </span>
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-slate-400">
                    Requested on {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{b.gearItem?.name}</h4>
                  <p className="text-xs text-slate-600">
                    Borrower: <strong className="text-slate-800">{b.user?.name}</strong> ({b.user?.department}) | Purpose: {b.purpose}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                  <span>Start: <strong>{new Date(b.startDate).toLocaleString()}</strong></span>
                  <span>Return: <strong>{new Date(b.endDate).toLocaleString()}</strong></span>
                  <span>Deposit Required: <strong>${b.gearItem?.depositAmount.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 min-w-[280px]">
                {b.status === 'PENDING' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assign Physical Unit Tag:
                      </label>
                      <select
                        value={selectedUnits[b.id] || b.gearUnitId || ''}
                        onChange={(e) => setSelectedUnits({ ...selectedUnits, [b.id]: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="">Auto-assign first free unit</option>
                        {b.gearItem?.units
                          ?.filter((u: any) => u.isAvailable && u.condition !== 'DAMAGED' && u.condition !== 'MISSING')
                          .map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.unitTag} ({u.condition})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(b.id, 'APPROVE')}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleAction(b.id, 'REJECT')}
                        className="py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {b.status === 'APPROVED' && (
                  <div className="space-y-2 text-center">
                    <p className="text-xs text-slate-600">
                      Reserved Unit: <strong className="text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{b.gearUnit?.unitTag}</strong>
                    </p>
                    <button
                      onClick={() => handleAction(b.id, 'ISSUE')}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5"
                    >
                      <HandMetal className="w-4 h-4" /> Issue / Handout Gear to Borrower
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
