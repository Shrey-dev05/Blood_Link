'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Plus, Users, Calendar, QrCode, CheckCircle2, 
  MapPin, Clock, X, ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { Camp } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function OrganizerDashboard() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Camp Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCamp, setNewCamp] = useState({
    title: '',
    venue_address: '',
    city: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    start_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 86400000 * 3 + 28800000).toISOString().slice(0, 16),
    target_capacity: 100,
    contact_phone: '+91-11-23314567',
    partner_blood_bank: 'Indian Red Cross Regional Blood Bank'
  });

  // Attendee Check-in State
  const [checkInCode, setCheckInCode] = useState('');
  const [selectedCampId, setSelectedCampId] = useState('');
  const [checkInResult, setCheckInResult] = useState<any>(null);

  const loadCamps = async () => {
    try {
      const data = await api.getCamps();
      setCamps(data);
      if (data.length > 0 && !selectedCampId) {
        setSelectedCampId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamps();
  }, []);

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCamp(newCamp);
      setIsCreateOpen(false);
      loadCamps();
      alert('Camp published successfully!');
    } catch (err: any) {
      alert(`Error creating camp: ${err.message}`);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedCampId || !checkInCode.trim()) return;
    try {
      const res = await api.checkInCampAttendee(selectedCampId, checkInCode.trim());
      setCheckInResult(res);
      loadCamps();
    } catch (err: any) {
      setCheckInResult({ status: 'FAILED', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Building2 className="w-6 h-6 text-rose-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">NGO & Camp Organizer Workspace</h1>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Verified Partner
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lions Club Delhi Central Blood Care • Community drives, capacity limits, and QR check-in
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Camp</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camp Drives List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
            Organized Blood Drives ({camps.length})
          </h2>

          <div className="space-y-4">
            {camps.map((camp) => (
              <div
                key={camp.id}
                onClick={() => setSelectedCampId(camp.id)}
                className={`p-6 bg-white rounded-3xl border transition-all cursor-pointer ${selectedCampId === camp.id ? 'border-blood-600 ring-2 ring-blood-100 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={camp.status} size="sm" />
                  <span className="text-xs text-slate-500 font-semibold">{camp.city}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{camp.title}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blood-600 shrink-0" />
                  <span className="truncate">{camp.venue_address}</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">Registrations:</span>
                    <strong className="text-slate-900 font-bold">{camp.registered_count}</strong> / {camp.target_capacity}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Turnout / Attended:</span>
                    <strong className="text-emerald-700 font-bold">{camp.attended_count} Donors</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Camp Reception & Check-in Desk (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <QrCode className="w-5 h-5 text-blood-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">On-Site Donor Check-in Desk</h3>
                <p className="text-[11px] text-slate-500">Scan or enter attendee registration pass</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Camp Drive</label>
                <select
                  value={selectedCampId}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blood-500"
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Attendee Pass Code</label>
                <input
                  type="text"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  placeholder="e.g. CAMP-5421"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono uppercase focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <button
                onClick={handleCheckIn}
                disabled={!checkInCode.trim()}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Validate Attendee Turnout
              </button>

              {checkInResult && (
                <div className={`p-4 rounded-2xl text-xs ${checkInResult.status === 'CHECKED_IN' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
                  <div className="font-bold mb-1">
                    {checkInResult.status === 'CHECKED_IN' ? '✓ Attendee Checked In!' : checkInResult.status}
                  </div>
                  <p>{checkInResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Camp Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Publish New Donation Drive</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Camp Title *</label>
                <input
                  type="text"
                  required
                  value={newCamp.title}
                  onChange={(e) => setNewCamp({ ...newCamp, title: e.target.value })}
                  placeholder="e.g. Rohini Community Blood Drive 2026"
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Venue Address *</label>
                <input
                  type="text"
                  required
                  value={newCamp.venue_address}
                  onChange={(e) => setNewCamp({ ...newCamp, venue_address: e.target.value })}
                  placeholder="e.g. Community Center, Sector 14, Rohini"
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newCamp.city}
                    onChange={(e) => setNewCamp({ ...newCamp, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Donor Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newCamp.target_capacity}
                    onChange={(e) => setNewCamp({ ...newCamp, target_capacity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newCamp.start_date}
                    onChange={(e) => setNewCamp({ ...newCamp, start_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newCamp.end_date}
                    onChange={(e) => setNewCamp({ ...newCamp, end_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Partner Blood Bank</label>
                <input
                  type="text"
                  value={newCamp.partner_blood_bank}
                  onChange={(e) => setNewCamp({ ...newCamp, partner_blood_bank: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blood-700 hover:bg-blood-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors mt-2"
              >
                Publish Camp Drive
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
