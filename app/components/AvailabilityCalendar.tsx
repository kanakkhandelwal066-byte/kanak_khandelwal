'use client';

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AvailabilityCalendarProps {
  gearItems: any[];
}

export default function AvailabilityCalendar({ gearItems }: AvailabilityCalendarProps) {
  const [selectedGearId, setSelectedGearId] = useState<string>(gearItems[0]?.id || '');

  const selectedItem = gearItems.find((g) => g.id === selectedGearId) || gearItems[0];

  // Generate next 7 days list
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().slice(0, 10),
      displayDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateObj: d,
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-sky-600" /> Physical Unit Schedule & Availability Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual 7-day timeline showing real-time physical unit assignments and free slots
          </p>
        </div>

        {/* Gear Item Selector */}
        <select
          value={selectedGearId}
          onChange={(e) => setSelectedGearId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 font-semibold text-slate-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          {gearItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.units?.length || 0} physical units)
            </option>
          ))}
        </select>
      </div>

      {selectedItem ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">{selectedItem.name}</span>
              <span className="text-slate-500 ml-2">Category: {selectedItem.category?.name}</span>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Free / Available
              </span>
              <span className="flex items-center gap-1 font-semibold text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Borrowed / Reserved
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Damaged / Maintenance
              </span>
            </div>
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="py-3 px-4 font-semibold w-40">Unit Tag</th>
                  <th className="py-3 px-3 font-semibold w-28">Status</th>
                  {days.map((day) => (
                    <th key={day.dateStr} className="py-3 px-2 text-center font-semibold">
                      <div className="text-[10px] text-slate-400 uppercase">{day.displayDay}</div>
                      <div>{day.displayDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedItem.units?.map((unit: any) => {
                  const isMaintenance = unit.condition === 'DAMAGED' || unit.condition === 'MISSING';

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[11px]">
                            {unit.unitTag}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">#{unit.serialNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={unit.condition} type="condition" />
                      </td>
                      {days.map((day) => {
                        if (isMaintenance) {
                          return (
                            <td key={day.dateStr} className="py-3 px-2 text-center">
                              <span className="inline-block w-full py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold text-[10px] border border-rose-200">
                                Damaged
                              </span>
                            </td>
                          );
                        }

                        // Check if this unit is booked on this day
                        const dayStart = new Date(day.dateObj);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(day.dateObj);
                        dayEnd.setHours(23, 59, 59, 999);

                        const activeBooking = unit.bookings?.find((b: any) => {
                          const bStart = new Date(b.startDate);
                          const bEnd = new Date(b.endDate);
                          return bStart < dayEnd && bEnd > dayStart;
                        });

                        if (activeBooking) {
                          return (
                            <td key={day.dateStr} className="py-3 px-2 text-center">
                              <div
                                className="w-full py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-300"
                                title={`Booked by ${activeBooking.user?.name || 'User'} (${activeBooking.purpose})`}
                              >
                                {activeBooking.status === 'ISSUED' ? 'Borrowed' : 'Reserved'}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day.dateStr} className="py-3 px-2 text-center">
                            <span className="inline-block w-full py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                              Available
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-6">No gear items found</p>
      )}
    </div>
  );
}
