'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, User, ShieldAlert, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface TransferModalProps {
  booking: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ booking, onClose, onSuccess }: TransferModalProps) {
  const { currentUser, users } = useUser();
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  // Filter out current borrower from eligible new borrowers list
  const eligibleBorrowers = users.filter((u) => u.id !== booking.userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId) {
      setError('Please select a new borrower');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          staffUserId: currentUser?.id || 'admin-user-id',
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transfer loan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedNewBorrower = users.find((u) => u.id === toUserId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-lg">Transfer Active Loan</h3>
              <p className="text-xs text-slate-400">Loan Code: {booking.bookingCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Loan Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Equipment Item:</span>
              <span className="font-extrabold text-slate-900">{booking.gearItem?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Assigned Unit Tag:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                {booking.gearUnit?.unitTag || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Current Borrower:</span>
              <span className="font-bold text-slate-800">{booking.user?.name} ({booking.user?.department})</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Original Due Date (Unchanged):
              </span>
              <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {new Date(booking.endDate).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Select New Borrower */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Borrower / Recipient
            </label>
            <select
              required
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">-- Choose New Borrower --</option>
              {eligibleBorrowers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role} - {u.department || 'General'}) [Max: {u.maxActiveBookings || 3} items]
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Preview Box */}
          {selectedNewBorrower && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-900">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Transfer Handover Summary
              </div>
              <p className="text-slate-700">
                Loan will transfer from <strong className="text-slate-900">{booking.user?.name}</strong> $\rightarrow$ <strong className="text-slate-900">{selectedNewBorrower.name}</strong>.
              </p>
              <p className="text-[11px] text-indigo-700">
                ✓ Original due date ({new Date(booking.endDate).toLocaleDateString()}) and assigned unit ({booking.gearUnit?.unitTag}) remain identical.
              </p>
            </div>
          )}

          {/* Reason / Audit Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Reason / Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Group project handover / Co-director takeover"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !toUserId}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {isSubmitting ? 'Transferring Loan...' : 'Confirm Loan Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
