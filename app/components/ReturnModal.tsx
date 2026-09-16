'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, DollarSign, Calculator, RotateCcw } from 'lucide-react';
import { calculateReturnFees } from '@/lib/services/return.service';

interface ReturnModalProps {
  booking: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ booking, onClose, onSuccess }: ReturnModalProps) {
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [conditionOnReturn, setConditionOnReturn] = useState<'EXCELLENT' | 'GOOD' | 'NEEDS_MAINTENANCE' | 'DAMAGED' | 'MISSING'>('GOOD');
  const [notes, setNotes] = useState('');
  const [feeCalc, setFeeCalc] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      const nowISO = new Date().toISOString().slice(0, 16);
      setActualReturnDate(nowISO);
    }
  }, [booking]);

  useEffect(() => {
    if (!booking || !actualReturnDate) return;

    const returnDate = new Date(actualReturnDate);
    const dueDate = new Date(booking.endDate);
    const dailyFee = booking.gearItem?.dailyLateFee || 5;
    const deposit = booking.gearItem?.depositAmount || 0;

    const result = calculateReturnFees(dueDate, returnDate, dailyFee, deposit);
    setFeeCalc(result);
  }, [booking, actualReturnDate]);

  if (!booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          staffUserId: 'admin-user-id',
          actualReturnDate: new Date(actualReturnDate).toISOString(),
          conditionOnReturn,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-lg">Process Gear Return</h3>
              <p className="text-xs text-slate-400">Booking Code: {booking.bookingCode}</p>
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Borrower & Gear Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Borrower:</span>
              <span className="font-bold text-slate-900">{booking.user?.name} ({booking.user?.department})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gear Item:</span>
              <span className="font-bold text-slate-900">{booking.gearItem?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Unit Tag:</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {booking.gearUnit?.unitTag || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Due Date:</span>
              <span className="font-semibold text-slate-800">
                {new Date(booking.endDate).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actual Return Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Return Timestamp
            </label>
            <input
              type="datetime-local"
              required
              value={actualReturnDate}
              onChange={(e) => setActualReturnDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Condition on Return Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Unit Condition on Inspection
            </label>
            <select
              value={conditionOnReturn}
              onChange={(e) => setConditionOnReturn(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="EXCELLENT">Excellent - Like new, fully functional</option>
              <option value="GOOD">Good - Standard condition, fully operational</option>
              <option value="NEEDS_MAINTENANCE">Needs Maintenance - Functional but needs service</option>
              <option value="DAMAGED">Damaged - Requires repair (unit marked unavailable)</option>
              <option value="MISSING">Missing / Lost - (unit marked unavailable)</option>
            </select>
          </div>

          {/* Late Fee & Deposit Invoice Breakdown Box */}
          {feeCalc && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              feeCalc.isOverdue ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                <span className="flex items-center gap-1">
                  <Calculator className="w-4 h-4 text-sky-600" /> Accounting Breakdown
                </span>
                {feeCalc.isOverdue ? (
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                    ⚠️ {feeCalc.daysOverdue} Day(s) Overdue
                  </span>
                ) : (
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    On-Time Return
                  </span>
                )}
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Original Deposit Held:</span>
                <span className="font-semibold">${feeCalc.depositAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Late Fee Deduction (${feeCalc.dailyFee.toFixed(2)}/day):</span>
                <span className={`font-semibold ${feeCalc.lateFeeCharged > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  -${feeCalc.lateFeeCharged.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold pt-1 border-t text-slate-900">
                <span>Net Refundable Amount:</span>
                <span className="text-emerald-700 text-base bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                  ${feeCalc.depositRefunded.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Return Inspection Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Notes / Comments
            </label>
            <input
              type="text"
              placeholder="e.g. Cables returned neatly, slight scuff on lens body"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Processing Return...' : 'Finalize Return & Release Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
