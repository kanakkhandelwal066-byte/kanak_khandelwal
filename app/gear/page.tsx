'use client';

import React, { useState, useEffect } from 'react';
import GearCard from '../components/GearCard';
import GearModal from '../components/GearModal';
import BookingModal from '../components/BookingModal';
import { useUser } from '../context/UserContext';
import { Camera, Plus, Search, Filter, Layers, RefreshCw } from 'lucide-react';
import { GearItemWithUnits } from '@/lib/types';

export default function GearInventoryPage() {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [gearItems, setGearItems] = useState<GearItemWithUnits[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedBookingGear, setSelectedBookingGear] = useState<GearItemWithUnits | null>(null);
  const [selectedEditingGear, setSelectedEditingGear] = useState<GearItemWithUnits | null>(null);
  const [isAddingGear, setIsAddingGear] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGearData = async () => {
    setIsLoading(true);
    try {
      const [gearRes, catRes] = await Promise.all([
        fetch(`/api/gear?categoryId=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`),
        fetch('/api/categories'),
      ]);

      if (gearRes.ok) setGearItems(await gearRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error('Failed to load gear inventory data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGearData();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-sky-600" /> AV Equipment & Physical Unit Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse multi-unit equipment catalog, check individual unit condition tags, and submit borrowing reservations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddingGear(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md shadow-slate-900/20"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Gear Item
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search gear name, model, specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Gear ({gearItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Gear Grid Display */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-600" /> Loading equipment catalog...
        </div>
      ) : gearItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Equipment Found</h3>
          <p className="text-xs">Try selecting another category or clearing your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gearItems.map((item) => (
            <GearCard
              key={item.id}
              gearItem={item}
              onBook={(item) => setSelectedBookingGear(item)}
              onEdit={(item) => setSelectedEditingGear(item)}
            />
          ))}
        </div>
      )}

      {/* Booking Reservation Modal */}
      {selectedBookingGear && (
        <BookingModal
          gearItem={selectedBookingGear}
          onClose={() => setSelectedBookingGear(null)}
          onSuccess={fetchGearData}
        />
      )}

      {/* Gear Item Create / Edit Modal */}
      {(isAddingGear || selectedEditingGear) && (
        <GearModal
          gearItem={selectedEditingGear}
          categories={categories}
          onClose={() => {
            setIsAddingGear(false);
            setSelectedEditingGear(null);
          }}
          onSuccess={fetchGearData}
        />
      )}
    </div>
  );
}
