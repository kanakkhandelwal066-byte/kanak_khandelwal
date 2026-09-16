'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Camera, AlertCircle } from 'lucide-react';

interface GearModalProps {
  gearItem: any | null; // Null if creating new
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GearModal({ gearItem, categories, onClose, onSuccess }: GearModalProps) {
  const isEditing = !!gearItem;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [depositAmount, setDepositAmount] = useState('50.00');
  const [dailyLateFee, setDailyLateFee] = useState('10.00');
  const [maxBorrowDays, setMaxBorrowDays] = useState('7');
  const [initialUnitsCount, setInitialUnitsCount] = useState('2');
  const [unitTagPrefix, setUnitTagPrefix] = useState('GEAR');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gearItem) {
      setName(gearItem.name || '');
      setCategoryId(gearItem.categoryId || '');
      setModel(gearItem.model || '');
      setDescription(gearItem.description || '');
      setImageUrl(gearItem.imageUrl || '');
      setDepositAmount(String(gearItem.depositAmount || 0));
      setDailyLateFee(String(gearItem.dailyLateFee || 0));
      setMaxBorrowDays(String(gearItem.maxBorrowDays || 7));
    } else if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [gearItem, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/gear/${gearItem.id}` : '/api/gear';
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        name,
        categoryId,
        model,
        description,
        imageUrl,
        depositAmount: parseFloat(depositAmount),
        dailyLateFee: parseFloat(dailyLateFee),
        maxBorrowDays: parseInt(maxBorrowDays, 10),
        ...(isEditing
          ? {}
          : {
              initialUnitsCount: parseInt(initialUnitsCount, 10),
              unitTagPrefix,
            }),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save gear item');
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
          <h3 className="font-bold text-lg">{isEditing ? 'Edit Gear Item' : 'Add New AV Equipment'}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Canon EOS R6 Mark II"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Specs</label>
              <input
                type="text"
                placeholder="e.g. 24-105mm Kit"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Refundable Deposit ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Late Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={dailyLateFee}
                onChange={(e) => setDailyLateFee(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Borrow Days</label>
              <input
                type="number"
                min="1"
                required
                value={maxBorrowDays}
                onChange={(e) => setMaxBorrowDays(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {!isEditing && (
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-sky-900">Physical Units Initialization</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={initialUnitsCount}
                    onChange={(e) => setInitialUnitsCount(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unit Tag Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. DSLR, MIC"
                    value={unitTagPrefix}
                    onChange={(e) => setUnitTagPrefix(e.target.value.toUpperCase())}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Technical specs and kit contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-md shadow-slate-900/30"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Gear & Generate Units'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
