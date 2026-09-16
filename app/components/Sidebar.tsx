'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '../context/UserContext';
import {
  LayoutDashboard,
  Camera,
  CalendarDays,
  BookmarkCheck,
  ClipboardList,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Gear Inventory', href: '/gear', icon: Camera },
    { label: 'Availability Calendar', href: '/availability', icon: CalendarDays },
    { label: 'My Bookings', href: '/bookings', icon: BookmarkCheck },
  ];

  const adminNavItems = [
    { label: 'Approve Requests', href: '/admin/requests', icon: ClipboardList, badge: 'Staff' },
    { label: 'Process Returns', href: '/admin/returns', icon: RotateCcw, badge: 'Staff' },
    { label: 'Settings & Limits', href: '/admin/settings', icon: Sliders, badge: 'Admin' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shrink-0 border-r border-slate-800">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lending Staff Desk</p>
            {!isAdmin && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded font-medium">
                Admin View Only
              </span>
            )}
          </div>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  } ${!isAdmin ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 mt-6 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400" /> Active System Status
        </div>
        <div className="flex justify-between">
          <span>Concurrency Check:</span>
          <span className="text-emerald-400 font-medium">Enforced</span>
        </div>
        <div className="flex justify-between">
          <span>Deposit Refund:</span>
          <span className="text-emerald-400 font-medium">Auto-deduct</span>
        </div>
      </div>
    </aside>
  );
}
