'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Users, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { useUser } from '@/app/context/UserContext';

export default function AdminSettingsPage() {
  const { users, refreshUsers } = useUser();
  const [maxActiveBookings, setMaxActiveBookings] = useState('3');
  const [defaultLateFee, setDefaultLateFee] = useState('5.00');
  const [collegeName, setCollegeName] = useState('St. Jude College of Media & Arts');

  const [userLimits, setUserLimits] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.default_max_active_bookings_per_user) {
          setMaxActiveBookings(data.default_max_active_bookings_per_user);
        }
        if (data.default_late_fee_per_day) {
          setDefaultLateFee(data.default_late_fee_per_day);
        }
        if (data.college_name) {
          setCollegeName(data.college_name);
        }
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const limits: Record<string, number> = {};
    users.forEach((u) => {
      limits[u.id] = u.maxActiveBookings || 3;
    });
    setUserLimits(limits);
  }, [users]);

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_max_active_bookings_per_user: maxActiveBookings,
          default_late_fee_per_day: defaultLateFee,
          college_name: collegeName,
        }),
      });

      if (res.ok) {
        setSavedMessage('Global system settings updated successfully!');
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-sky-600" /> Admin System Settings & Configurable Booking Limits
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure default borrowing policies, late fee schedules, and individual student reservation limits.
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Lending Policies Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" /> Global Lending System Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Enforced across all equipment reservations</p>
          </div>

          <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / Institution Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Concurrent Active Limit per Borrower
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxActiveBookings}
                  onChange={(e) => setMaxActiveBookings(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Late Fee Rate ($ / Day)
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={defaultLateFee}
                  onChange={(e) => setDefaultLateFee(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md shadow-slate-900/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-sky-400" />
              {isSaving ? 'Saving Settings...' : 'Save Global Policies'}
            </button>
          </form>
        </div>

        {/* Individual User Booking Limits Table */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> User-Specific Reservation Limits
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Override max concurrent items per student</p>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <p className="text-slate-500">{u.email} ({u.role})</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Max Active:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                    {u.maxActiveBookings ?? 3} items
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
