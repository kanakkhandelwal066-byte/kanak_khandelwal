'use client';

import React from 'react';
import { Camera, CheckCircle2, ShieldAlert, DollarSign, Calendar, Layers, Plus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { GearItemWithUnits } from '@/lib/types';
import { useUser } from '../context/UserContext';

interface GearCardProps {
  gearItem: GearItemWithUnits;
  onBook: (item: GearItemWithUnits) => void;
  onEdit?: (item: GearItemWithUnits) => void;
}

export default function GearCard({ gearItem, onBook, onEdit }: GearCardProps) {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const totalUnits = gearItem.units?.length || 0;
  const operationalUnits = gearItem.units?.filter(
    (u) => u.isAvailable && u.condition !== 'DAMAGED' && u.condition !== 'MISSING'
  ).length || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Card Header & Image */}
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {gearItem.imageUrl ? (
            <img
              src={gearItem.imageUrl}
              alt={gearItem.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
              <Camera className="w-12 h-12" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {gearItem.category?.name}
            </span>
          </div>

          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(gearItem)}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow transition"
            >
              Edit Gear
            </button>
          )}
        </div>

        {/* Card Details */}
        <div className="p-5 space-y-3">
          <div>
            <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-sky-600 transition">
              {gearItem.name}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{gearItem.model || 'Standard AV Kit'}</p>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {gearItem.description || 'Professional grade equipment maintained by College AV Center.'}
          </p>

          {/* Units Status Breakdown Pill */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-600" /> Total Units:
              </span>
              <span className="font-bold text-slate-900">{totalUnits} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Operational Pool:</span>
              <span className="font-semibold text-emerald-700">{operationalUnits} / {totalUnits} operational</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 overflow-x-auto">
              {gearItem.units?.map((u) => (
                <span
                  key={u.id}
                  title={`Unit ${u.unitTag}: ${u.condition}`}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    u.condition === 'DAMAGED' || u.condition === 'MISSING'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {u.unitTag}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[10px]">REFUNDABLE DEPOSIT</span>
              <span className="font-extrabold text-slate-900 text-sm">${gearItem.depositAmount.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">PER-DAY LATE FEE</span>
              <span className="font-semibold text-rose-600">${gearItem.dailyLateFee.toFixed(2)} / day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-5 pt-0">
        <button
          onClick={() => onBook(gearItem)}
          disabled={operationalUnits === 0}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {operationalUnits > 0 ? 'Check Dates & Reserve' : 'Out of Stock / Maintenance'}
        </button>
      </div>
    </div>
  );
}
