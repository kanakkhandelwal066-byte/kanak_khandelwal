'use client';

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import NotificationDropdown from './NotificationDropdown';
import { Shield, User, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header() {
  const { currentUser, users, setCurrentUser, switchRole } = useUser();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleResetSeed = async () => {
    if (!confirm('Re-seed demo database? This will reset demo bookings and return records.')) return;
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        setSeedMessage('Database re-seeded successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setSeedMessage('Re-seed failed.');
      }
    } catch (err) {
      setSeedMessage('Error re-seeding.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
          AV
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight flex items-center gap-2">
            College AV Gear Lending
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 tracking-wider">
              St. Jude Campus
            </span>
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Real-time equipment availability, borrowing requests, & deposit returns
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Re-seed demo button */}
        <button
          onClick={handleResetSeed}
          disabled={isSeeding}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Reset database to demo seed data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        {seedMessage && (
          <span className="hidden lg:flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> {seedMessage}
          </span>
        )}

        <NotificationDropdown />

        {/* User & Role Switcher Bar */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => switchRole('STUDENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentUser?.role === 'STUDENT'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            onClick={() => switchRole('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentUser?.role === 'ADMIN'
                ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin / Staff</span>
          </button>
        </div>

        {/* Current Demo User Selection Dropdown */}
        <select
          value={currentUser?.id || ''}
          onChange={(e) => {
            const selected = users.find((u) => u.id === e.target.value);
            if (selected) setCurrentUser(selected);
          }}
          className="text-xs bg-white border border-slate-200 font-medium text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
