'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/app/components/StatusBadge';
import ReturnModal from '@/app/components/ReturnModal';
import { RotateCcw, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function AdminReturnsPage() {
  const [issuedBookings, setIssuedBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIssuedQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings?status=ISSUED');
      if (res.ok) {
        const data = await res.json();
        setIssuedBookings(data);
      }
    } catch (err) {
      console.error('Failed to load active borrowings queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuedQueue();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-emerald-600" /> Lending Staff Desk: Equipment Returns & Refund Accounting
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Inspect returned equipment, record physical condition (Good/Damaged/Missing), and calculate refundable deposit minus late fees.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" /> Loading active return queue...
        </div>
      ) : issuedBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Equipment Currently Borrowed</h3>
          <p className="text-xs">All active rentals have been returned and units released back to available inventory.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issuedBookings.map((b) => {
            const now = new Date();
            const dueDate = new Date(b.endDate);
            const isOverdue = dueDate < now;
            let daysOverdue = 0;
            if (isOverdue) {
              const diff = now.getTime() - dueDate.getTime();
              daysOverdue = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }

            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 text-xs">
                      {b.bookingCode}
                    </span>
                    {isOverdue ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE ({daysOverdue} day{daysOverdue > 1 ? 's' : ''})
                      </span>
                    ) : (
                      <StatusBadge status="ISSUED" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{b.gearItem?.name}</h4>
                    <p className="text-xs text-slate-600">
                      Borrower: <strong className="text-slate-800">{b.user?.name}</strong> ({b.user?.department})
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                    <span>Assigned Unit Tag: <strong className="text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{b.gearUnit?.unitTag || 'N/A'}</strong></span>
                    <span>Expected Due Date: <strong>{dueDate.toLocaleString()}</strong></span>
                    <span>Held Deposit: <strong>${b.gearItem?.depositAmount.toFixed(2)}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="py-2.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Process Return & Inspect
                  </button>
                  {isOverdue && (
                    <span className="text-[11px] font-bold text-rose-600">
                      Estimated Late Fee: ${(daysOverdue * b.gearItem?.dailyLateFee).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {selectedBooking && (
        <ReturnModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSuccess={fetchIssuedQueue}
        />
      )}
    </div>
  );
}
