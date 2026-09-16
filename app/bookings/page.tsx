'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { useUser } from '../context/UserContext';
import { BookmarkCheck, Clock, Calendar, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function BookingsPage() {
  const { currentUser } = useUser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const roleParam = currentUser.role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
      const res = await fetch(`/api/bookings?userId=${currentUser.id}&role=${roleParam}&status=${selectedStatus}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser, selectedStatus]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this reservation request?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', reason: 'Cancelled by borrower' }),
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error('Failed to cancel booking', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookmarkCheck className="w-6 h-6 text-sky-600" /> Borrowing Reservations & History
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {currentUser?.role === 'ADMIN' ? 'Viewing all system borrowings' : `Bookings history for ${currentUser?.name}`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm flex items-center gap-2 overflow-x-auto">
        {['ALL', 'PENDING', 'APPROVED', 'ISSUED', 'RETURNED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedStatus === status
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status === 'ALL' ? 'All Bookings' : status}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" /> Loading bookings history...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Bookings Found</h3>
          <p className="text-xs">There are no reservation records matching this status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const now = new Date();
            const isOverdue = b.status === 'ISSUED' && new Date(b.endDate) < now;

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 text-xs">
                      {b.bookingCode}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{b.gearItem?.name}</h4>
                      <p className="text-xs text-slate-500">Borrower: {b.user?.name} ({b.user?.department})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverdue ? (
                      <StatusBadge status="OVERDUE" />
                    ) : (
                      <StatusBadge status={b.status} />
                    )}

                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Cancel Request"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TIME WINDOW</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(b.startDate).toLocaleDateString()} $\rightarrow$ {new Date(b.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">ASSIGNED PHYSICAL UNIT</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mt-0.5 font-mono">
                      {b.gearUnit?.unitTag || 'Pending Unit Assignment'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">PURPOSE & NOTES</span>
                    <span className="font-medium text-slate-700 block truncate">{b.purpose}</span>
                  </div>
                </div>

                {/* Return Record Invoice Breakdown if Returned */}
                {b.returnRecord && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>Return Invoice Processed on {new Date(b.returnRecord.actualReturnDate).toLocaleDateString()}</span>
                      <span>Condition: {b.returnRecord.conditionOnReturn}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Deposit Refunded: <strong className="text-emerald-700">${b.returnRecord.depositRefunded.toFixed(2)}</strong></span>
                      {b.returnRecord.lateFeeCharged > 0 && (
                        <span className="text-rose-600 font-bold">Late Fee Deducted: ${b.returnRecord.lateFeeCharged.toFixed(2)} ({b.returnRecord.daysOverdue} days)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
