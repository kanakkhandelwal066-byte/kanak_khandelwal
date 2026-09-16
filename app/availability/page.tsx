'use client';

import React, { useState, useEffect } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import BookingModal from '../components/BookingModal';
import { Calendar, Search, CheckCircle2, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { GearItemWithUnits } from '@/lib/types';

export default function AvailabilityPage() {
  const [gearItems, setGearItems] = useState<GearItemWithUnits[]>([]);
  const [selectedGearId, setSelectedGearId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [checkResult, setCheckResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedBookingGear, setSelectedBookingGear] = useState<GearItemWithUnits | null>(null);

  useEffect(() => {
    fetch('/api/gear')
      .then((res) => res.json())
      .then((data) => {
        setGearItems(data);
        if (data.length > 0) {
          setSelectedGearId(data[0].id);
        }
      });

    // Default dates: tomorrow 09:00 to 3 days later 17:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const defaultEnd = new Date(tomorrow);
    defaultEnd.setDate(defaultEnd.getDate() + 3);
    defaultEnd.setHours(17, 0, 0, 0);

    setStartDate(tomorrow.toISOString().slice(0, 16));
    setEndDate(defaultEnd.toISOString().slice(0, 16));
  }, []);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGearId || !startDate || !endDate) return;

    setIsChecking(true);
    try {
      const startISO = new Date(startDate).toISOString();
      const endISO = new Date(endDate).toISOString();
      const res = await fetch(
        `/api/availability?gearItemId=${selectedGearId}&startDate=${startISO}&endDate=${endISO}`
      );
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      }
    } catch (err) {
      console.error('Check failed', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (selectedGearId && startDate && endDate) {
      handleCheck();
    }
  }, [selectedGearId, startDate, endDate]);

  const selectedItem = gearItems.find((g) => g.id === selectedGearId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sky-600" /> Equipment Availability & Schedule Engine
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify physical unit availability for your target event dates before submitting borrowing requests.
        </p>
      </div>

      {/* Date-Range Realtime Lookup Tool */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-sky-400" /> Interactive Date Availability Lookup
        </h3>

        <form onSubmit={handleCheck} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Equipment</label>
            <select
              value={selectedGearId}
              onChange={(e) => setSelectedGearId(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {gearItems.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Return</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Real-time Status Banner */}
        {checkResult && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {checkResult.isAvailable ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm text-white">
                  {checkResult.isAvailable
                    ? `Available! (${checkResult.availableUnitsCount} unit(s) free)`
                    : 'Unavailable for Selected Window'}
                </h4>
                <p className="text-xs text-slate-300">
                  {checkResult.gearItemName}: {checkResult.availableUnitsCount} of {checkResult.operationalUnits} operational units free ({checkResult.conflictingBookingsCount} active bookings overlap).
                </p>
              </div>
            </div>

            {checkResult.isAvailable && selectedItem && (
              <button
                onClick={() => setSelectedBookingGear(selectedItem)}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-extrabold text-xs transition shadow-lg shrink-0 flex items-center gap-1.5"
              >
                Proceed to Request <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 7-Day Timeline Matrix */}
      {gearItems.length > 0 && <AvailabilityCalendar gearItems={gearItems} />}

      {/* Booking Modal */}
      {selectedBookingGear && (
        <BookingModal
          gearItem={selectedBookingGear}
          onClose={() => setSelectedBookingGear(null)}
          onSuccess={() => handleCheck()}
        />
      )}
    </div>
  );
}
