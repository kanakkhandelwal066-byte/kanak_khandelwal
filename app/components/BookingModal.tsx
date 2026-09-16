'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { GearItemWithUnits } from '@/lib/types';

interface BookingModalProps {
  gearItem: GearItemWithUnits | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ gearItem, onClose, onSuccess }: BookingModalProps) {
  const { currentUser } = useUser();
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [availability, setAvailability] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize default date range: Tomorrow 09:00 to 3 days later 17:00
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const defaultEnd = new Date(tomorrow);
    defaultEnd.setDate(defaultEnd.getDate() + 3);
    defaultEnd.setHours(17, 0, 0, 0);

    setStartDate(tomorrow.toISOString().slice(0, 16));
    setEndDate(defaultEnd.toISOString().slice(0, 16));
  }, []);

  // Real-time Availability check whenever dates or gear item changes
  useEffect(() => {
    if (!gearItem || !startDate || !endDate) return;

    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      setError(null);
      try {
        const startISO = new Date(startDate).toISOString();
        const endISO = new Date(endDate).toISOString();
        const res = await fetch(
          `/api/availability?gearItemId=${gearItem.id}&startDate=${startISO}&endDate=${endISO}`
        );
        if (res.ok) {
          const data = await res.json();
          setAvailability(data);
        }
      } catch (err) {
        console.error('Failed availability check', err);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    const timer = setTimeout(checkAvailability, 300);
    return () => clearTimeout(timer);
  }, [gearItem, startDate, endDate]);

  if (!gearItem || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          gearItemId: gearItem.id,
          purpose,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking request');
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
          <div>
            <h3 className="font-bold text-lg">Request Gear Reservation</h3>
            <p className="text-xs text-slate-400">Borrower: {currentUser.name} ({currentUser.department})</p>
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected Gear Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">SELECTED GEAR</p>
              <h4 className="font-bold text-slate-900 text-base">{gearItem.name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{gearItem.model}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 block">Refundable Deposit</span>
              <span className="text-lg font-bold text-sky-700">${gearItem.depositAmount.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">Late Fee: ${gearItem.dailyLateFee.toFixed(2)}/day</span>
            </div>
          </div>

          {/* Date & Time Range Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> Expected Return
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Realtime Availability Status Box */}
          <div className="p-3.5 rounded-2xl border text-xs">
            {isCheckingAvailability ? (
              <p className="text-slate-500 font-medium animate-pulse">Checking unit-level schedule availability...</p>
            ) : availability ? (
              availability.isAvailable ? (
                <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold">Unit Available!</p>
                      <p className="text-[11px] text-emerald-700">
                        {availability.availableUnitsCount} unit(s) free for this time window.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-800 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">Fully Booked for Date Range</p>
                    <p className="text-[11px] text-rose-700">
                      All units reserved or checked out during this slot. Please select different dates.
                    </p>
                  </div>
                </div>
              )
            ) : null}
          </div>

          {/* Purpose & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose of Borrowing (Required for Staff Approval)
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Media Production Class Project / Event Screening"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Notes / Requested Accessories (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Need extra battery pack or tripod plate"
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
              disabled={isSubmitting || (availability && !availability.isAvailable)}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition shadow-md shadow-sky-600/30"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Reservation Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
